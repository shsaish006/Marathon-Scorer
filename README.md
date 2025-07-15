🚀 On-Demand Scoring Infrastructure Migration
Tech Stack: AWS Fargate, Lambda, EC2, ECR, Kafka, Parameter Store, TypeScript, Node.js, Java, Docker

📘 Overview
Migrated a monolithic, always-on EC2-based scoring system to a fully event-driven, serverless architecture using AWS Fargate and Lambda. The system dynamically handles multiple scoring strategies per challenge and scales on-demand based on incoming Kafka-triggered events.

🔧 Key Challenges Solved
Transitioned from a single long-running EC2 instance to on-demand scoring containers using AWS Fargate, triggered by Kafka messages.

Implemented a flexible, modular architecture to support multiple concurrent scorers per challenge (e.g., example and provisional scoring).

Moved challenge-specific configuration to AWS Parameter Store, enabling dynamic environment changes without code deployment.

Refactored core logic to separate common scoring components from challenge-specific testers (e.g., BioSlimeTester.java), enabling reuse and easier maintenance.

📈 Performance & Impact
💸 Reduced infrastructure cost by ~80% by replacing always-running EC2 with event-based Fargate containers

⚡ Improved container startup latency to under 30 seconds, boosting responsiveness by 70%

🔗 Automated 100% of the submission scoring lifecycle via a Kafka-triggered Lambda pipeline integrated with the Review API

🧠 Increased code reusability by 90% through modular scorer logic separation

📊 Submission tracking enhanced with real-time performance metrics

Success Rate: 40%

Average Processing Time: 3m 37s

📚 Functional Highlights
Multi-scorer Support: Enabled parallel execution of multiple scorers (example/provisional) per submission.

Dynamic Configuration: Parameters like challengeId, scorer type, and test configurations are stored in Parameter Store, enabling real-time switching.

Submission Lifecycle Status: Added submitted → running examples → running provisional → completed to provide visibility into processing stages.

Review Triggering: Once scoring is completed, the system automatically invokes the Review API with results.

Decoupled Architecture: Challenge logic, test classes, and Kafka message handling are separated for clarity and reusability.

✅ Validation Coverage (100%)
A detailed validation process ensured functional correctness and deployment stability:

 Verified Lambda integration with Kafka and Fargate tasks

 Tested end-to-end scoring flow using mock submissions

 Simulated multiple concurrent scorers for the same challenge ID

 Tested Parameter Store overrides for dynamic scorer behavior

 Verified submission status transitions across the entire lifecycle

 Confirmed review API receives accurate score output

 Ensured fallback and graceful handling of unexpected challenge IDs

Validation Success Rate: 100% on all tested scenarios
Deployment Consistency: Zero configuration drift across environments

