import zipfile
import io

# Create minimal DOCX structure
def create_minimal_docx(text_content, filename):
    # DOCX is a ZIP file with specific structure
    buffer = io.BytesIO()
    
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as docx:
        # Add content_types
        docx.writestr('[Content_Types].xml', '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>''')
        
        # Add main relationship
        docx.writestr('_rels/.rels', '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>''')
        
        # Add document content
        document_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:r><w:t>{text_content}</w:t></w:r></w:p>
</w:body>
</w:document>'''
        docx.writestr('word/document.xml', document_xml)
    
    # Write to file
    with open(filename, 'wb') as f:
        f.write(buffer.getvalue())
    
    print(f"Created {filename}")

# Create test DOCX file
text = """Коммерческое предложение ООО "ТестВорд" на разработку мобильного приложения.
Стоимость проекта: 950,000 рублей.
Срок выполнения: 3 месяца.
Команда разработки: 4 специалиста.
Технологии: React Native, Node.js, MongoDB.
Опыт компании: более 30 успешных проектов.
Гарантийное обслуживание: 8 месяцев."""

create_minimal_docx(text, 'test_word_file.docx')
