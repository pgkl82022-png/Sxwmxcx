import sys,zipfile,tempfile,unittest
sys.path.insert(0,'scripts')
from xlsx_to_csv import convert
class ExcelTest(unittest.TestCase):
 def test_100_rows(self):
  ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
  rows=['<row r="1"><c r="A1" t="inlineStr"><is><t>名称</t></is></c><c r="B1" t="inlineStr"><is><t>库存</t></is></c></row>']
  rows += [f'<row r="{i+2}"><c r="A{i+2}" t="inlineStr"><is><t>苹果{i}</t></is></c><c r="B{i+2}"><v>100</v></c></row>' for i in range(100)]
  with tempfile.NamedTemporaryFile(suffix='.xlsx') as f:
   with zipfile.ZipFile(f.name,'w') as z:
    z.writestr('xl/workbook.xml',f'<workbook xmlns="{ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="商品" sheetId="1" r:id="rId1"/></sheets></workbook>')
    z.writestr('xl/_rels/workbook.xml.rels','<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')
    z.writestr('xl/worksheets/sheet1.xml',f'<worksheet xmlns="{ns}"><sheetData>'+''.join(rows)+'</sheetData></worksheet>')
   self.assertEqual(len(convert(f.name).splitlines()),101)
if __name__=='__main__':unittest.main()
