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
      title: 'Software Developer',
      company: 'Ouster',
      location: 'Ottawa, ON',
      start: new ResumeDate('2022-05'),
      end: new ResumeDate(null),
      points: {
        arch: {
          text: 'Architected high-performance data processing pipelines in C++ for LiDAR point-cloud generation, handling millions of points per second with strict latency budgets.',
          tags: ['C++', 'LiDAR', 'Performance'],
        },
        api: {
          text: 'Designed and maintained developer-facing APIs and SDK interfaces used by partners to integrate LiDAR sensors into autonomous vehicles and robotics platforms.',
          tags: ['API Design', 'C++', 'LiDAR'],
        },
        scale: {
          text: 'Optimized local drivers and backend services to handle high-throughput sensor data streams, reducing end-to-end processing latency by over 30%.',
          tags: ['C++', 'Performance', 'LiDAR'],
        },
        devops: {
          text: 'Engineered automated testing frameworks and CI/CD deployment pipelines using Docker and Jenkins, significantly reducing release cycle time.',
          tags: ['DevOps', 'Docker', 'CI/CD'],
        },
        mentorship: {
          text: 'Led technical design reviews and mentored junior engineers, establishing coding standards and review practices adopted across the team.',
          tags: ['Leadership'],
        },
        auth: {
          text: 'Implemented authentication and authorization flows for the developer SDK, enabling secure token-based access to sensor configuration and firmware update endpoints.',
          tags: ['Auth', 'API Design', 'Python'],
        },
        perception_kalman: {
          text: 'Improved the motion estimation pipeline by tuning extended Kalman filter parameters for LiDAR-based object tracking, reducing position error on fast-moving vehicles by 25%.',
          tags: ['Sensor Fusion', 'C++', 'LiDAR'],
        },
        eval_metrics: {
          text: 'Developed a comprehensive evaluation metrics framework to benchmark tracking and detection quality against ground-truth datasets, enabling data-driven iteration on perception algorithms.',
          tags: ['Python', 'LiDAR', 'Machine Learning'],
        },
        classification: {
          text: 'Built an object classification pipeline using Naive Bayes and Random Forest models to categorize detected objects from LiDAR point clouds, achieving over 90% accuracy on validation data.',
          tags: ['Machine Learning', 'Python', 'LiDAR'],
        },
        tracking_perf: {
          text: 'Improved multi-object tracking throughput by refactoring the association algorithm and reducing unnecessary point cloud copies, doubling the number of simultaneously tracked objects.',
          tags: ['C++', 'Performance', 'LiDAR'],
        },
        rust_actuator: {
          text: 'Developed an event-driven actuator service in Rust that processes sensor trigger signals with sub-millisecond latency, replacing a legacy C++ component with improved safety guarantees.',
          tags: ['Rust', 'Performance'],
        },
        integration_tests: {
          text: 'Advocated for and bootstrapped an end-to-end integration test suite using pytest, establishing test infrastructure that caught regressions before reaching production and improved team confidence in releases.',
          tags: ['Python', 'Testing', 'DevOps'],
        },
      },
    },
    untether: {
      title: 'Runtime Software Engineer — Internship',
      company: 'Untether AI',
      location: 'Toronto, ON',
      start: new ResumeDate('2021-05'),
      end: new ResumeDate('2021-08'),
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
          text: 'Developed tools for the hardware team to ensure the reliability of the product, uncovering critical issues.',
          tags: ['Python', 'Embedded'],
        },
      },
    },
    cepton: {
      title: 'Software Engineer — Internship',
      company: 'Cepton',
      location: 'Ottawa, ON',
      start: new ResumeDate('2020-01'),
      end: new ResumeDate('2020-12'),
      points: {
        tracking_redesign: {
          text: 'Redesigned the object tracking logic with a C++ K-d Tree implementation that matches tracked objects with clusters from the proceeding point cloud frame, increasing the maximum number of trackable objects by 900%.',
          tags: ['C++', 'Performance', 'LiDAR'],
        },
        background_detector: {
          text: 'Developed a background change detector that utilizes ICP to periodically check if a sensor has moved from its initial position, notifying the user if the sensor has shifted.',
          tags: ['C++', 'Sensor Fusion', 'LiDAR'],
        },
        kalman_filter: {
          text: 'Implemented an extended Kalman filter to track real-time vehicle motion from noisy LiDAR data using a bicycle kinematic model, significantly improving vehicle tracking compared to the original unicycle model implementation.',
          tags: ['C++', 'Sensor Fusion', 'LiDAR'],
        },
        ml_pipeline: {
          text: 'Formulated an ML pipeline in Python for object classification that optimizes scikit-learn model parameters for small datasets to simplify the model creation process.',
          tags: ['Python', 'Machine Learning'],
        },
        lidar_camera_overlay: {
          text: 'Designed a LiDAR-camera overlay application that measures the homogeneous transform between a LiDAR and camera and aligns the LiDAR point cloud with the camera output.',
          tags: ['C++', 'Sensor Fusion', 'LiDAR'],
        },
        chessboard_detection: {
          text: 'Created a method to locate a chessboard within a point cloud using DBSCAN and within an image using OpenCV, which together determines the LiDAR-camera transform.',
          tags: ['C++', 'Sensor Fusion'],
        },
        clustering: {
          text: 'Established a K-d Tree density-based clustering algorithm that finds all clusters within a point cloud, removes outliers, and locates the point cloud of the chessboard.',
          tags: ['C++', 'LiDAR'],
        },
      },
    },
    savormetrics: {
      title: 'Embedded Systems Engineer',
      company: 'Savormetrics',
      location: 'Mississauga, ON',
      start: new ResumeDate('2019-05'),
      end: new ResumeDate('2019-08'),
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
      title: 'Software Developer',
      company: 'Teranet',
      location: 'Mississauga, ON',
      start: new ResumeDate('2018-09'),
      end: new ResumeDate('2018-12'),
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
