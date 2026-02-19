import './App.css'
import { RESUME_STORE } from './resume.store'
import { ACTIVE_PROFILE } from './resume.profile'
import type { ExperienceSelection } from './resume.profile'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="section-title">{children}</h2>
}

function ContactLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href}>{children}</a>
}

function SkillRow({ label, items }: { label: string; items: readonly string[] }) {
  return (
    <div className="skill-group">
      <strong>{label}:</strong>
      {items.join(', ')}
    </div>
  )
}

function JobEntry({ selection }: { selection: ExperienceSelection }) {
  const job = RESUME_STORE.experience[selection.id]
  // TypeScript limitation: correlated union indexing can't be statically narrowed here.
  // Safety is guaranteed upstream — selectJob<K> enforces valid point keys per job at authorship.
  const points = job.points as Record<string, { category?: string; text: string }>
  return (
    <article className="entry">
      <div className="job-header">
        <h3 className="job-title-name">{job.title}</h3>
        <span className="company">{job.company}</span>
      </div>
      <div className="date-loc">
        {job.start} — {job.end} | {job.location}
      </div>
      <ul>
        {selection.points.map((pointKey) => {
          const point = points[pointKey]
          return (
            <li key={pointKey}>
              {point.category ? <strong>{point.category}: </strong> : null}
              {point.text}
            </li>
          )
        })}
      </ul>
    </article>
  )
}

function App() {
  const { header, skills, education, interests } = RESUME_STORE
  return (
    <div className="app-shell">
      <div className="resume-card">
        <header className="resume-header">
          <h1>{header.name}</h1>
          <address className="contact-info">
            <ContactLink href={`mailto:${header.email}`}>{header.email}</ContactLink>
            <ContactLink href={`https://${header.linkedin}`}>{header.linkedin}</ContactLink>
            <ContactLink href={`https://${header.github}`}>{header.github}</ContactLink>
          </address>
        </header>

        <section>
          <SectionTitle>Technical Skills</SectionTitle>
          <div className="skills-list">
            {ACTIVE_PROFILE.skillGroups.map((key) => (
              <SkillRow key={key} label={skills[key].label} items={skills[key].items} />
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Work Experience</SectionTitle>
          {ACTIVE_PROFILE.experience.map((selection) => (
            <JobEntry key={selection.id} selection={selection} />
          ))}
        </section>

        <section>
          <SectionTitle>Education</SectionTitle>
          <article className="entry">
            <div className="job-header">
              <span><strong>{education.school}</strong> — {education.degree}</span>
              <span className="date-loc-inline">{education.date}</span>
            </div>
          </article>
        </section>

        <section>
          <SectionTitle>Interests</SectionTitle>
          <p className="interests-text">{interests}</p>
        </section>
      </div>
    </div>
  )
}

export default App
