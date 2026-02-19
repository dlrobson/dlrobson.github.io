import './App.css'
import { RESUME_STORE } from './resume.store'
import { ACTIVE_PROFILE } from './resume.profile'
import type { ExperienceSelection } from './resume.profile'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="section-title">{children}</h2>
}

function JobEntry({ selection }: { selection: ExperienceSelection }) {
  const job = RESUME_STORE.experience[selection.id]
  // TypeScript limitation: correlated union indexing can't be statically narrowed here.
  // Safety is guaranteed upstream — selectJob<K> enforces valid point keys per job at authorship.
  const points = job.points as Record<string, { category?: string; text: string }>
  return (
    <div className="entry">
      <div className="job-title">
        <span className="job-title-name">{job.title}</span>
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
    </div>
  )
}

function App() {
  return (
    <div className="app-shell">
      <div className="resume-card">
        <header className="resume-header">
          <h1>{RESUME_STORE.header.name}</h1>
          <div className="contact-info">
            <a href={`mailto:${RESUME_STORE.header.email}`}>{RESUME_STORE.header.email}</a>
            <a href={`https://${RESUME_STORE.header.linkedin}`}>{RESUME_STORE.header.linkedin}</a>
            <a href={`https://${RESUME_STORE.header.github}`}>{RESUME_STORE.header.github}</a>
          </div>
        </header>

        <section>
          <SectionTitle>Technical Skills</SectionTitle>
          <div className="skills-list">
            {ACTIVE_PROFILE.skillGroups.map((key) => (
              <div key={key} className="skill-group">
                <strong>{RESUME_STORE.skills[key].label}:</strong>
                {RESUME_STORE.skills[key].items.join(', ')}
              </div>
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
          <div className="entry">
            <div className="job-title">
              <span>
                <strong>{RESUME_STORE.education.school}</strong> — {RESUME_STORE.education.degree}
              </span>
              <span className="date-loc-inline">{RESUME_STORE.education.date}</span>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle>Interests</SectionTitle>
          <p className="interests-text">{RESUME_STORE.interests}</p>
        </section>
      </div>
    </div>
  )
}

export default App
