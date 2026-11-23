import React, {useState} from 'react'
import {createRoot} from 'react-dom/client'
import ComponentDoc from '../../src/components/ui/ComponentDoc'

const longHeading = 'Long heading with the complete accessible text that must remain available when truncated in the table of contents'
const markdown = `# Responsive documentation

## ${longHeading}

Readable body content must use the full available article width, even with a sidebar and a narrow parent inside a wide viewport.

\`\`\`js
${'const wideCode = "' + '0123456789'.repeat(24) + '";'}
\`\`\`

| Key | Value | Description |
| --- | --- | --- |
| table | ${'long-value-'.repeat(16)} | Horizontal scrolling stays inside the article. |

${Array.from({length: 10}, (_, i) => `## Section ${i + 2}\n\n${'A paragraph for anchor scrolling and active tracking. '.repeat(8)}`).join('\n\n')}
`

function Fixture() {
    const [width, setWidth] = useState('100%')
    const [height, setHeight] = useState('420px')
    const [custom, setCustom] = useState(false)
    window.docFixture = {setWidth, setHeight, setCustom, longHeading}
    return <div id="fixture-container" style={{width, maxWidth: '100%', boxSizing: 'border-box', padding: 16}}>
        <ComponentDoc markdown={markdown} height={height}
                      renderMarkdown={custom ? ({components}) => <section data-custom-renderer="true">
                          {components.h1({children: 'Custom title'})}
                          {components.h2({children: longHeading})}
                          {components.p({children: 'Custom renderer content'})}
                      </section> : undefined}/>
    </div>
}

createRoot(document.getElementById('root')).render(<Fixture/>)
