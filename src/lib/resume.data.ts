import { ResumeDate } from './resume-date'
import type { ResumeData } from './resume.types'
import { PROFILE } from './profile'

export const RESUME_DATA = {
  header: PROFILE,
  skills: {
    languages: {
      label: 'Software & Languages',
      items: ['C++', 'Python', 'Rust'],
    },
    infra: {
      label: 'Frameworks & Infrastructure',
      items: [
        'Docker',
        'AWS',
        'React',
        'Node.js',
        'CMake',
        'Git',
        'Jenkins',
        'DynamoDB',
      ],
    },
    systems: {
      label: 'Systems & Perception',
      items: [
        'System Architecture',
        'API Design',
        'Algorithm Optimization',
        'OpenCV',
        'Kalman Filtering',
      ],
    },
  },
  experience: {
    ouster: {
      company: 'Ouster',
      location: 'Ottawa, ON',
      periods: [
        {
          title: 'Software Developer',
          start: new ResumeDate('2022-05'),
          end: new ResumeDate(null),
        },
        {
          title: 'Software Developer Intern',
          start: new ResumeDate('2021-09'),
          end: new ResumeDate('2022-04'),
        },
      ] as const,
      points: {
        zone_filtering: {
          text: 'Implemented polygon-based zone filtering for LiDAR point clouds in C++, enabling real-time exclusion of detections within configurable spatial boundaries to eliminate false positives in undesired areas.',
          tags: ['C++', 'LiDAR', 'Perception'],
        },
        ekf_tracking: {
          text: 'Implemented and tuned an advanced kinematic model Extended Kalman Filter in C++ for vehicle motion estimation, fusing LiDAR point cloud measurements to predict future states and improve tracking continuity. Later collaborated on a significant retune and refinement of the filter to further improve tracking accuracy.',
          tags: ['C++', 'Perception', 'LiDAR'],
        },
        clustering: {
          text: 'Hardened the point cloud clustering pipeline in C++ to maintain robust object grouping under sparse and missing LiDAR returns, reducing segmentation fragmentation in low-return scenarios.',
          tags: ['C++', 'Perception', 'LiDAR'],
        },
        classification: {
          text: 'Implemented a Gaussian Naive Bayes classifier in C++ for real-time vehicle classification from LiDAR-derived spatial features, improving classification accuracy.',
          tags: ['C++', 'Machine Learning', 'Perception', 'Rust'],
        },
        bbox_alignment: {
          text: 'Improved bounding box orientation alignment for detected vehicles through an iterative search over point cloud returns, yielding more spatially accurate object representations.',
          tags: ['C++', 'Perception'],
        },
        eval_framework: {
          text: 'Implemented a prediction-to-ground-truth matching algorithm using a distance-based cost matrix for the internal tracking evaluation framework, enabling MOTA and MOTP metric computation against labelled datasets.',
          tags: ['Perception', 'Testing', 'Performance', 'Python'],
        },
        testing: {
          text: 'Championed integration testing culture within the team, establishing the integration test project from its initial package structure through to a robust suite covering production Docker images. Introduced reusable fixtures for product installation to minimize code duplication and accelerate test authoring.',
          tags: ['Python', 'Testing', 'Docker', 'DevOps'],
        },
        multi_instance: {
          text: 'Architected a scalable, distributed perception system to balance computational load across multiple nodes. Secured inter-node communication using mutual TLS client certificate authentication.',
          tags: ['Auth', 'C++', 'API Design', 'Performance'],
        },
        auth: {
          text: 'Implemented an OAuth 2.0 Authorization Code Flow with PKCE using Keycloak to secure the perception product stack, enabling fine-grained access control and user management for customers.',
          tags: ['Auth'],
        },
        installation: {
          text: 'Redesigned and re-implemented the software installation and distribution system across Debian, RPM, and container-based delivery targets, establishing a reliable and maintainable packaging pipeline.',
          tags: ['DevOps', 'Docker'],
        },
        code_quality: {
          text: 'Enforced Python code quality standards across the codebase by integrating Ruff linting and automated formatting checks into the CI pipeline.',
          tags: ['CI/CD', 'Python'],
        },
        dl_scaffolding: {
          text: 'Architected a production-grade deep learning inference pipeline utilizing a C++ backend for model execution and a Rust-based REST API for efficient data routing and request management.',
          tags: ['C++', 'Rust', 'Machine Learning'],
        },
        multi_gpu: {
          text: 'Extended the deep learning inference pipeline with automatic multi-GPU distribution, enabling data-parallel inference across all available GPUs without manual configuration.',
          tags: ['Machine Learning', 'Performance', 'Rust', 'C++'],
        },
        event_system: {
          text: 'Designed and delivered a modular, Rust-based event-driven system under tight deadlines, enabling configurable condition-action pipelines (e.g., triggering webhooks when objects satisfy spatial or temporal criteria). Iterated significantly on the initial release in response to customer feedback, reducing system complexity, standardizing output payloads across all modules for easier downstream consumption, and broadening extensibility.',
          tags: ['Rust', 'API Design'],
        },
        tbb: {
          text: 'Evaluated, validated, and integrated Intel TBB into the perception product to parallelize previously serial processing stages, achieving a 10x throughput improvement in many cases.',
          tags: ['C++', 'Performance'],
        },
        devcontainers: {
          text: 'Led the team migration to devcontainer-based development workflows, providing consistent, per-project isolated environments that eliminated environment drift and reduced onboarding friction.',
          tags: ['DevOps', 'Docker'],
        },
        gcp_infra: {
          text: 'Established reliable, reproducible GCP VM infrastructure for integration testing using Packer for image provisioning and Terraform for infrastructure-as-code orchestration.',
          tags: ['DevOps', 'CI/CD'],
        },
        jenkins: {
          text: 'Architected and co-maintained modular Jenkins-based CI/CD pipelines, integrating automated code quality checks and expanding C++ static analysis coverage. Optimized pipeline execution time to improve developer feedback cycles and ensure reliable image publishing.',
          tags: ['CI/CD', 'DevOps', 'C++'],
        },
        rust_testing: {
          text: 'Refactored legacy Rust code with extensive unchecked error handling on external library boundaries, introducing mock and fake implementations to enable deterministic, reliable unit tests for the affected functionality.',
          tags: ['Rust', 'Testing'],
        },
        argo_workflows: {
          text: 'Developed Argo Workflows pipelines to automate the previously manual perception performance evaluation process, enabling scalable parallel job execution across datasets and dramatically reducing the time required to assess tracking quality.',
          tags: ['DevOps', 'Perception'],
        },
      },
    },
    untether: {
      company: 'Untether AI',
      location: 'Toronto, ON',
      periods: [
        {
          title: 'Software Developer Intern',
          start: new ResumeDate('2021-05'),
          end: new ResumeDate('2021-08'),
        },
      ] as const,
      points: {
        throughput: {
          text: 'Developed high-performance software interfaces for AI inference acceleration, increasing data throughput by 40-100x through optimized memory-mapped I/O and DMA transfers.',
          tags: ['C++', 'Performance'],
        },
        multichip: {
          text: 'Optimized multi-chip utilization logic to meet strict latency requirements, balancing workload distribution across inference accelerator cores.',
          tags: ['C++', 'Performance'],
        },
        tools: {
          text: 'Developed tools for the hardware team to ensure the reliability of the product.',
          tags: ['Python', 'Embedded'],
        },
      },
    },
    cepton: {
      company: 'Cepton',
      location: 'Ottawa, ON',
      periods: [
        {
          title: 'Software Developer Intern',
          start: new ResumeDate('2020-09'),
          end: new ResumeDate('2020-12'),
        },
        {
          title: 'Software Developer Intern',
          start: new ResumeDate('2020-01'),
          end: new ResumeDate('2020-04'),
        },
      ] as const,
      points: {
        perception_sensor_fusion: {
          text: 'Engineered a multi-modal calibration and overlay system using OpenCV and DBSCAN to compute homogeneous transforms, aligning LiDAR point clouds with camera feeds for real-time spatial visualization.',
          tags: ['C++', 'Sensor Fusion', 'LiDAR'],
        },
        tracking_optimization: {
          text: 'Architected a high-performance tracking engine using C++ K-d Trees and Extended Kalman Filters, increasing trackable object capacity by 900% while improving motion prediction via bicycle kinematic modeling.',
          tags: ['C++', 'Perception', 'Performance'],
        },
        system_integrity: {
          text: 'Developed an automated background change detector utilizing Iterative Closest Point (ICP) to monitor sensor stability and ensure data integrity by notifying users of physical sensor displacement.',
          tags: ['C++', 'Perception', 'LiDAR'],
        },
        ml_automation: {
          text: 'Streamlined object classification by formulating a Python pipeline that optimizes scikit-learn hyperparameters for small datasets, reducing manual model configuration time.',
          tags: ['Python', 'Machine Learning'],
        },
      },
    },
    savormetrics: {
      company: 'Savormetrics',
      location: 'Mississauga, ON',
      periods: [
        {
          title: 'Embedded Systems Developer',
          start: new ResumeDate('2019-05'),
          end: new ResumeDate('2019-08'),
        },
      ] as const,
      points: {
        visualization: {
          text: 'Developed Python-based data visualization tools to streamline the interpretation of complex sensor datasets for cross-functional teams.',
          tags: ['Python'],
        },
        firmware: {
          text: 'Engineered C++ firmware for automated sensor testing, significantly increasing hardware validation throughput and reducing R&D timelines.',
          tags: ['Embedded', 'C++'],
        },
      },
    },
    teranet: {
      company: 'Teranet',
      location: 'Mississauga, ON',
      periods: [
        {
          title: 'Software Developer',
          start: new ResumeDate('2018-09'),
          end: new ResumeDate('2018-12'),
        },
      ] as const,
      points: {
        testing: {
          text: 'Developed test harnesses and mock registry responses for a legacy on-premises application, enabling comprehensive testing of the application logic without reliance on external systems. This significantly improved testing efficiency and reliability.',
          tags: ['Testing', 'DevOps'],
        },
      },
    },
  },
  education: {
    school: 'University of Waterloo',
    degree: 'B.A.Sc., Mechatronics Engineering',
    date: new ResumeDate('2022-04'),
  },
  interests: ['Sourdough Baking', 'Self-Hosting'],
} as const satisfies ResumeData

export type AppData = typeof RESUME_DATA
export type JobKey = keyof AppData['experience']
export type SkillKey = keyof AppData['skills']
export type PointKey<J extends JobKey> =
  keyof AppData['experience'][J]['points']
