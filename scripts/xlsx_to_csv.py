"""Offline .xlsx first-sheet reader. No formulas/macros/external links are evaluated."""
import csv, io, sys, zipfile, xml.etree.ElementTree as E
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def convert(path):
    with zipfile.ZipFile(path) as z:
        if sum(i.file_size for i in z.infolist())>20_000_000: raise ValueError('Excel解压体积超过20MB')
        if any(i.filename.endswith('vbaProject.bin') for i in z.infolist()): raise ValueError('不支持宏文件')
        strings=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            root=E.fromstring(z.read('xl/sharedStrings.xml'))
            strings=[''.join(t.text or '' for t in si.findall('.//m:t',NS)) for si in root]
        workbook=E.fromstring(z.read('xl/workbook.xml'))
        sheet=workbook.find('m:sheets/m:sheet',NS)
        rid=sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
        rels=E.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rel=next(r for r in rels if r.attrib['Id']==rid)
        if rel.attrib.get('TargetMode')=='External': raise ValueError('不支持外部表格')
        target=rel.attrib['Target']
        name=target.lstrip('/') if target.startswith('/') else 'xl/'+target
        if '..' in name: raise ValueError('工作表路径无效')
        root=E.fromstring(z.read(name));output=io.StringIO();writer=csv.writer(output)
        rows=root.findall('m:sheetData/m:row',NS)
        if len(rows)>1001: raise ValueError('最多1000条商品')
        for row in rows:
            values=[]
            for cell in row.findall('m:c',NS):
                if cell.find('m:f',NS) is not None: raise ValueError('请先将公式转换为数值')
                letters=''.join(c for c in cell.attrib.get('r','A1') if c.isalpha());index=0
                for c in letters: index=index*26+ord(c.upper())-64
                if index>100: raise ValueError('最多100列')
                while len(values)<index: values.append('')
                typ=cell.attrib.get('t');value=cell.findtext('m:v','',NS)
                if typ=='s': value=strings[int(value)]
                elif typ=='inlineStr': value=''.join(t.text or '' for t in cell.findall('.//m:t',NS))
                values[index-1]=value
            writer.writerow(values)
        return output.getvalue()
if __name__=='__main__':
    if len(sys.argv)!=2: raise SystemExit('用法: python scripts/xlsx_to_csv.py products.xlsx > products.csv')
    sys.stdout.write(convert(sys.argv[1]))
