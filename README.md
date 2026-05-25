# AWS On-Demand Serverless Scoring Infrastructure Cockpit

A production-grade, highly optimized Full-Stack DevOps Cockpit and On-Demand Scoring Simulator demonstrating the successful migration of a monolithic legacy scoring server into a fully event-driven, cost-optimized, and containerized serverless architecture on Amazon Web Services (AWS).

---

## Platform Visualization

### System DevOps Architecture Topology
The migrated serverless architecture is depicted in the schematic layout below. Submissions publish events to Kafka, triggering AWS Lambda to scale ECS Fargate container instances dynamically, which fetch overrides from the SSM Parameter Store and invoke callback score updates.

![DevOps Architecture Diagram](architecture_diagram.png)

### Cockpit Performance Dashboard
Our premium dark-themed management cockpit provides real-time telemetry into active container clusters, Kafka message queues, CPU allocations, success thresholds, and interactive Recharts graphs tracking over 80 percent cost savings.

![Cockpit Performance Dashboard Mockup](dashboard_mockup.png)

---

## Core Architectural Overviews

The platform is designed around two core integration engines:

### 1. Spring-Boot Architectural Patterns in TypeScript (Backend)
To provide the modularity, type safety, and testability of an enterprise Java Spring Boot backend, the server is structured into clean decoupled layers:
*   **Repository Layer (DAO)**: Pure database interactions using Drizzle ORM (located in server/repositories/).
*   **Service Layer (Business Logic)**: Event-driven queues, async scoring timers, and Systems Manager (SSM) Parameter Store overrides (located in server/services/).
*   **Controller Layer (REST Endpoints)**: Handles HTTP dispatching and Zod body validation schemas (located in server/controllers/).

### 2. Live Interactive Scoring Simulator (Frontend)
A glowing glassmorphic React workspace enabling users to write solution payloads, submit solutions to a mock Kafka queue, monitor live Fargate container boot states, and inspect streaming Java test suite compilation and execution logs in a live terminal window.

---

## Repository File Structure

*   **client/**: React and Tailwind CSS Frontend
    *   **src/pages/Dashboard.tsx**: Modern analytics cockpit utilizing Recharts for active CPU and memory bandwidth loads, active tasks gauges, and EC2 vs. Fargate cost comparison charts.
    *   **src/pages/DevOpsVisualizer.tsx**: Functioning DevOps Incident and Cluster Orchestrator Simulator with animated SVG path data packet pulses, operations incident controls (Traffic Surge, Host Failure, SSM Hot-Reload), and active containers grids.
    *   **src/pages/Simulator.tsx**: Coding sandbox editor with mock contestant solution templates, container boot step progression indicators, and streaming log console streams.
    *   **src/pages/ParameterStore.tsx**: Enables active overrides and full CRUD (Add/Delete/Patch) configurations of live SSM environment parameters.
    *   **src/pages/QueryResolver.tsx**: Adaptive AI co-pilot chat interface utilizing predicate logic proofs and automated perfect solution code injections.
    *   **src/App.tsx**: Main React layout, state query hooks, navigation sidebars, and dark/light theme triggers.
    *   **src/index.css**: Custom design system tokens including responsive glassmorphism backdrops and adaptive theme classes.
*   **server/**: Layered TypeScript Express Backend
    *   **controllers/**: scoring, metrics, and parameters REST controllers resolving requests using Zod schemas.
    *   **services/**: event-driven queues, task allocators, and telemetry tracking schedulers.
    *   **repositories/**: relational PostgreSQL transactions and data access interfaces.
    *   **db.ts**: Database client setup featuring synchronous fallback connections to the In-Memory Simulator if the host database is unreachable.
    *   **routes.ts**: Connects REST controllers, services, and repositories to API endpoints.
    *   **index.ts**: Bootstraper file responsible for bootstrapping Express, seeding database assets, and linking client bundlers.
*   **go-aggregator/**: High-performance Go microservice aggregating raw telemetry statistics into persistent PostgreSQL records.
*   **java/**: Production-grade Java scorer executables mimicking containerized Fargate task runner algorithms.
*   **k8s/**: Complete local or production Kubernetes manifests including deployments, StatefulSets, secrets, ConfigMaps, and Horizontal Pod Autoscalers.
*   **terraform/**: Cloud infrastructure configuration templates for AWS ECS Fargate, Lambda, MSK, ECR, VPC, and SSM resources.
*   **.github/workflows/**: Continuous Integration pipelines covering TypeScript validation check tasks, Vite building, Docker image creation, and automated Go test suites.

---

## Core Java Scoring Runner

The core solution scoring is executed in Java 17 OpenJDK inside on-demand Fargate task containers, using standard contest validation architectures:
*   **java/BioSlimeTester.java**: A cellular automata simulation testing program. Runs a BioSlime grid across multiple ticks inside 50x50 matrices, analyzing algorithmic cellular colony survival densities and calculating provisional execution success rates.
*   **java/Scorer.java**: The Fargate container entry point script. It handles arguments parsing, calls Systems Manager API wrappers to resolve parameter overrides, runs the simulator grid, compiles contestant scores, and dispatches JSON score results to the external scoreboard callback endpoint.

---

## DevOps Incident and Cluster Orchestrator Simulator

The platform includes an advanced cluster orchestrator dashboard within the DevOps Visualizer to visually demonstrate heavy serverless infrastructure and auto-scaling events.

### 1. Animated SVG Data Packet Pulses
Whenever solution tasks are running or a heavy load surge is active, glowing colored data circles traverse the topology path lines between distinct systems:
*   Client Portal to Kafka MSK Queue
*   Kafka MSK Queue to AWS Lambda Router
*   AWS Lambda Router to ECR Container Pull and ECS Fargate Cluster
*   ECS Fargate Cluster to AWS Parameter Store (SSM Configuration pull)
*   ECS Fargate Cluster to AWS RDS PostgreSQL (Database persistence write)
*   AWS RDS PostgreSQL to Review Score Callback API

### 2. Operations Incident Control Triggers
Users can manually inject real-world serverless scenarios through the visual control board:
*   **Traffic Surge (15x scale)**: Dispatches 15 simultaneous scoring submissions onto the Kafka MSK partition queue. The autoscaler instantly provisions a grid of 15 running task pods inside the active cluster.
*   **Node Outage / Eviction**: Simulates a severe host failure on Host-Node-02 (AZ US-East-1b). Node status changes to OFFLINE, all hosted pods turn red (Evicted / NodeCrashed), and the orchestrator immediately triggers eviction protocols, rescheduling replacement pods onto healthy Host-node-01 and Host-node-03 instances.
*   **SSM Hot-Reload Config**: Updates active Parameter Store overrides and broadcasts sync triggers (SIGUSR1) to all active container tasks, flashing the active grid and hot-reloading configurations in real-time.

### 3. Active Container Pods Grid
Renders dynamic, high-fidelity pod cards representing each active Fargate task:
*   Pod Unique ID and assigned Host Node.
*   Operational state indicator: Image Pulling, Warm Booting, Running Examples, Running Provisional, Terminating, or Evicted.
*   Live progress percentage bar.
*   Container CPU usage percentage and memory allocation statistics.

---

## Local Setup and Installation Instructions

### Prerequisites
*   Node.js version 18 or above
*   npm package manager
*   PostgreSQL database (Optional: The application automatically boots into a high-fidelity In-Memory Database Simulator if a local database host is unreachable)

### 1. Environment Configurations
Create a .env file inside the root directory and define the following variables:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/marathon_scorer
PORT=5000
NODE_ENV=development
```

### 2. Install Project Dependencies
Run the command below to retrieve and install all node packages:
```bash
npm install
```

### 3. Start the Development Server
Execute the command below to initialize the backend Express server on port 5000 and mount the Vite development client:
```bash
npm run dev
```

### 4. Verify Code Integrity
Run the TypeScript compiler checks to validate codebase type safety:
```bash
npm run check
```

### 5. Production Compilation and Asset Bundling
To build the application for production deployment, run the command below. It compiles client pages and packages the backend TypeScript bundle into the dist directory:
```bash
npm run build
```
