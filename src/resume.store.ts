export interface ExperiencePoint {
    category?: string
    text: string
}

export interface Job {
    title: string
    company: string
    location: string
    start: string
    end: string
    points: Record<string, ExperiencePoint>
}

export interface ResumeStore {
    header: {
        name: string
        email: string
        linkedin: string
        github: string
    }
    skills: Record<string, {
        label: string
        items: readonly string[]
    }>
    experience: Record<string, Job>
    education: {
        school: string
        degree: string
        date: string
    }
    interests: string
}

export const RESUME_STORE = {
    header: {
        name: 'Daniel Robson',
        email: '',
        linkedin: 'linkedin.com/in/dlrobson',
        github: 'github.com/dlrobson',
    },
    skills: {
        languages: {
            label: 'Software & Languages',
            items: ['C++', 'Python', 'Java', 'JavaScript', 'C#', 'SQL', 'MATLAB'],
        },
        infra: {
            label: 'Frameworks & Infrastructure',
            items: ['Docker', 'AWS', 'React', 'Node.js', 'CMake', 'Git', 'Jenkins', 'DynamoDB'],
        },
        systems: {
            label: 'Systems & Perception',
            items: ['System Architecture', 'API Design', 'Algorithm Optimization', 'OpenCV', 'Kalman Filtering'],
        },
        devops: {
            label: 'DevOps & Tooling',
            items: ['Jenkins', 'GitHub Actions', 'Docker', 'Kubernetes', 'Terraform'],
        },
    },
    experience: {
        ouster: {
            title: 'Software Developer',
            company: 'Ouster',
            location: 'Ottawa, ON',
            start: 'May 2022',
            end: 'Present',
            points: {
                arch: {
                    category: 'Core Software & Architecture',
                    text: 'Architected high-performance data processing pipelines in C++ for LiDAR point-cloud generation...',
                },
                api: {
                    category: 'API & SDK Development',
                    text: 'Designed and maintained developer-facing APIs used by partners...',
                },
                scale: {
                    category: 'System Scalability',
                    text: 'Optimized backend services or local drivers to handle high-throughput sensor data...',
                },
                devops: {
                    category: 'CI/CD & DevOps',
                    text: 'Engineered automated testing frameworks and deployment pipelines...',
                },
                mentorship: {
                    category: 'Mentorship & Leadership',
                    text: 'Led technical design reviews and mentored junior engineers...',
                },
            },
        },
        untether: {
            title: 'Runtime Software Engineer — Internship',
            company: 'Untether AI',
            location: 'Toronto, ON',
            start: 'May 2021',
            end: 'Aug 2021',
            points: {
                throughput: {
                    text: 'Developed high-performance software interfaces for AI inference acceleration, increasing data throughput by 40-100×...',
                },
                multichip: {
                    text: 'Optimized multi-chip utilization logic to meet strict latency requirements...',
                },
            },
        },
        cepton: {
            title: 'Software Engineer — Internship',
            company: 'Cepton',
            location: 'Ottawa, ON',
            start: 'Jan 2020',
            end: 'Dec 2020',
            points: {
                tracking: {
                    text: 'Engineered an object tracking system in C++ utilizing K-d Trees and Extended Kalman Filters...',
                },
                calibration: {
                    text: 'Developed a computer vision pipeline for sensor fusion calibration...',
                },
            },
        },
        hidden_past_job: {
            title: 'Past Role',
            company: 'Old Corp',
            location: 'Waterloo, ON',
            start: '2018',
            end: '2019',
            points: {
                legacy: { text: "Some old experience that isn't always relevant." },
            },
        },
    },
    education: {
        school: 'University of Waterloo',
        degree: 'B.A.Sc., Mechatronics Engineering',
        date: 'April 2022',
    },
    interests: 'Sourdough Baking, Self-Hosting',
} as const satisfies ResumeStore

export type AppStore = typeof RESUME_STORE
export type JobKey = keyof AppStore['experience']
export type SkillKey = keyof AppStore['skills']
export type PointKey<J extends JobKey> = keyof AppStore['experience'][J]['points']
