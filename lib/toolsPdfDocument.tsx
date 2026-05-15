import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import {
  SECTION_ORDER,
  dayInLife,
  pdfFooter,
  setupGuide,
  tools,
  type Tool,
  type ToolSection,
} from '@/lib/toolsContent'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 52,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  title: {
    fontSize: 20,
    marginBottom: 6,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 9,
    color: '#666',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    marginTop: 12,
    marginBottom: 6,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4,
  },
  subHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 3,
    color: '#334155',
  },
  body: {
    fontSize: 9,
    marginBottom: 6,
    color: '#334155',
    lineHeight: 1.35,
  },
  subsectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#0f172a',
  },
  toolBlock: {
    marginBottom: 8,
  },
  toolName: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  toolLead: {
    fontSize: 8,
    marginBottom: 3,
    color: '#334155',
    lineHeight: 1.35,
  },
  label: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    marginTop: 2,
    color: '#475569',
  },
  bullet: {
    fontSize: 7,
    marginLeft: 8,
    marginBottom: 1,
    color: '#334155',
    lineHeight: 1.35,
  },
  example: {
    fontSize: 7,
    marginTop: 2,
    fontStyle: 'italic',
    color: '#64748b',
    lineHeight: 1.35,
  },
  link: {
    fontSize: 7,
    color: '#2563eb',
    marginTop: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 7,
    color: '#64748b',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
  },
})

function toolsBySection(): Record<ToolSection, Tool[]> {
  const map = {} as Record<ToolSection, Tool[]>
  for (const s of SECTION_ORDER) {
    map[s] = []
  }
  for (const t of tools) {
    map[t.section].push(t)
  }
  return map
}

export function ToolsPdfDocument() {
  const bySection = toolsBySection()
  const dateStr = new Date().toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Document
      title="MonkedCubed Tool Library"
      author="MonkedCubed"
      subject="Productivity suite — guides and tools"
    >
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>MonkedCubed – Tool Library</Text>
        <Text style={styles.subtitle}>
          Quick reference — generated {dateStr}. Match this to the in-app Learning → Tool Library
          page.
        </Text>

        <Text style={styles.sectionTitle}>Your first day</Text>
        <Text style={styles.subHeading}>Setting up the productivity tools</Text>
        <Text style={styles.body}>{setupGuide.day1Tool}</Text>
        <Text style={styles.subHeading}>Joining a program</Text>
        <Text style={styles.body}>{setupGuide.day1Program}</Text>
        <Text style={styles.subHeading}>Initial settings</Text>
        <Text style={styles.body}>{setupGuide.day1Settings}</Text>

        <Text style={styles.sectionTitle}>Tool instructions</Text>
        {SECTION_ORDER.filter((section) => bySection[section].length > 0).map((section) => {
          const list = bySection[section]
          return (
            <View key={section}>
              <Text style={styles.subsectionTitle}>{section}</Text>
              {list.map((tool) => (
                <View key={tool.id} style={styles.toolBlock} wrap={false}>
                  <Text style={styles.toolName}>{tool.name}</Text>
                  <Text style={styles.toolLead}>{tool.content}</Text>
                  <Text style={styles.label}>When to use</Text>
                  {tool.whenToUse.map((line, i) => (
                    <Text key={i} style={styles.bullet}>
                      • {line}
                    </Text>
                  ))}
                  <Text style={styles.label}>How to use</Text>
                  {tool.howToUse.map((line, i) => (
                    <Text key={i} style={styles.bullet}>
                      {i + 1}. {line}
                    </Text>
                  ))}
                  <Text style={styles.example}>Example: {tool.example}</Text>
                  {tool.link ? (
                    <Text style={styles.link}>In app: {tool.link}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )
        })}

        <Text style={styles.sectionTitle}>Day in the life</Text>
        <Text style={styles.subHeading}>First-time user</Text>
        <Text style={styles.body}>{dayInLife.firstTimeUser}</Text>
        <Text style={styles.subHeading}>Enrolled in Transform (day 23)</Text>
        <Text style={styles.body}>{dayInLife.enrolledUser}</Text>
        <Text style={styles.subHeading}>General productivity user</Text>
        <Text style={styles.body}>{dayInLife.generalUser}</Text>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${pdfFooter}  ·  Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}
