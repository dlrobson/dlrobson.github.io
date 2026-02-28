import { ResumeDate } from './resume-date'
import type { ResumeData } from './resume.types'

export const RESUME_DATA = {
  header: {
    name: 'Daniel Robson',
    email: '',
    linkedin: 'https://linkedin.com/in/dlrobson',
    github: 'https://github.com/dlrobson',
    website: 'https://dlrobson.github.io/',
  },
  skills: {
    languages: {
      label: 'Software & Languages',
      items: ['C++', 'Python', 'Java', 'JavaScript', 'C#', 'SQL', 'MATLAB'],
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
      start: new ResumeDate('2021-05'),
      end: new ResumeDate('2021-08'),
      points: {
        throughput: {
          text: 'Developed high-performance software interfaces for AI inference acceleration, increasing data throughput by 40-100×...',
        },
        multichip: {
          text: 'Optimized multi-chip utilization logic to meet strict latency requirements...',
        },
        tools: {
          text: 'Developed tools for the hardware team to ensure the reliability of the product, uncovering critical issues.',
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
        },
        background_detector: {
          text: 'Developed a background change detector that utilizes ICP to periodically check if a sensor has moved from its initial position, notifying the user if the sensor has shifted.',
        },
        kalman_filter: {
          text: 'Implemented an extended Kalman filter to track real-time vehicle motion from noisy LiDAR data using a bicycle kinematic model, significantly improving vehicle tracking compared to the original unicycle model implementation.',
        },
        ml_pipeline: {
          text: 'Formulated an ML pipeline in Python for object classification that optimizes scikit-learn model parameters for small datasets to simplify the model creation process.',
        },
        lidar_camera_overlay: {
          text: 'Designed a LiDAR-camera overlay application that measures the homogeneous transform between a LiDAR and camera and aligns the LiDAR point cloud with the camera output.',
        },
        chessboard_detection: {
          text: 'Created a method to locate a chessboard within a point cloud using DBSCAN and within an image using OpenCV, which together determines the LiDAR-camera transform.',
        },
        clustering: {
          text: 'Established a K-d Tree density-based clustering algorithm that finds all clusters within a point cloud, removes outliers, and locates the point cloud of the chessboard.',
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
        automation: {
          text: 'Automated product testing procedures to control multiple devices using serial port communication in bash, increasing the rate of data collection by over 1000%.',
        },
        visualization: {
          text: 'Created visualizations using Python that organized complex sensor output data for quick analysis by the AI modelling team.',
        },
        firmware: {
          text: 'Developed Arduino firmware to simultaneously test a variety of sensors, greatly decreasing testing time.',
        },
        cad: {
          text: 'Designed and printed various 3D models of product components for precise testing by the hardware team. These designs include a sensor casing that was incorporated into the final design.',
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
          text: 'Designed an offline testing environment to mimic registry responses using C# and HTML, allowing the international team to perform uninterrupted application testing.',
        },
        debugging: {
          text: 'Uncovered a fix to a major ongoing server crashing issue through developing a Windows Service and PowerShell script to restart the program at designated times.',
        },
        monitoring: {
          text: 'Embedded an exportable SQL table displaying the health of every webpage and service into an existing web application, allowing users to easily monitor server health status.',
        },
      },
    },
    linamar: {
      title: 'Mechanical Engineer',
      company: 'Linamar Corporation',
      location: 'Guelph, ON',
      start: new ResumeDate('2018-01'),
      end: new ResumeDate('2018-04'),
      points: {
        cad_design: {
          text: 'Designed many mechanical fixtures using SolidWorks, including one that measures 6 different product specifications simultaneously. This specific fixture increased the efficiency of the process by over 300%.',
        },
        ventilation: {
          text: "Redesigned the welding cell's ventilation system using AutoCAD. The new system was implemented and effectively prevented welders from breathing harmful chemicals.",
        },
        vba: {
          text: "Reprogrammed various faulty VBA macros that were critical to the company's day-to-day operations.",
        },
      },
    },
    sub_and_sandwich_factory: {
      title: 'Lead Employee',
      company: 'Sub and Sandwich Factory',
      location: 'Ayr, ON',
      start: new ResumeDate('2017-06'),
      end: new ResumeDate('2017-09'),
      points: {
        communication: {
          text: 'Developed communication skills through interactions with customers and coworkers.',
        },
        paced_environment: {
          text: 'Demonstrated ability to work in a high paced environment by maintaining composure during busy hours to ensure high quality of service.',
        },
        multitasking: {
          text: 'Exhibited ability to take on many tasks by serving multiple customers while simultaneously performing other necessary work in the kitchen.',
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
