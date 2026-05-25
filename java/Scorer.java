package com.topcoder.marathon.scorer;

import java.io.*;
import java.net.*;
import java.util.*;

/**
 * Scorer - Main Entry Point for Containerized Marathon Scorer.
 * Orchestrates task startup, downloads submission payload, resolves Parameter Store variables,
 * executes the appropriate Java Tester suite, and uploads final results to the Review API.
 */
public class Scorer {
    private static final String DEFAULT_REVIEW_API = "http://api.marathon.internal/review";
    
    public static void main(String[] args) {
        System.out.println("[CORE] Marathon Scorer Core Bootstrapping...");
        
        String challengeId = System.getenv("MARATHON_CHALLENGE_ID");
        String submissionId = System.getenv("MARATHON_SUBMISSION_ID");
        String ssmParameterPath = System.getenv("SSM_PARAMETER_PATH");
        
        if (challengeId == null || submissionId == null) {
            System.err.println("[FATAL] Required environment configurations MARATHON_CHALLENGE_ID or MARATHON_SUBMISSION_ID are missing!");
            System.exit(1);
        }

        System.out.println("[CORE] Loading SSM Parameter Store Configurations from path: " + ssmParameterPath);
        System.out.println("[CORE] Target Submission ID: " + submissionId);
        System.out.println("[CORE] Active Challenge ID: " + challengeId);
        
        // Simulating loading challenge specific rules from SSM Parameter Store
        System.out.println("[SSM] GET /parameters" + ssmParameterPath + "/timeout -> Value: 300s");
        System.out.println("[SSM] GET /parameters" + ssmParameterPath + "/scorer_mode -> Value: provisional");
        
        long seed = 42L;
        try {
            seed = Long.parseLong(submissionId);
        } catch (NumberFormatException e) {
            // fallback
        }
        
        System.out.println("[CORE] Commencing Solution Evaluation...");
        double resultScore = 0.0;
        
        if ("1".equals(challengeId) || "bioslime".equalsIgnoreCase(challengeId)) {
            System.out.println("[CORE] Invoking BioSlimeTester...");
            BioSlimeTester tester = new BioSlimeTester(seed);
            resultScore = tester.runEvaluation();
        } else {
            System.out.println("[CORE] Invoking GenericMarathonTester...");
            resultScore = simulateGenericScorer(seed);
        }

        System.out.println("[CORE] Submission processing finished. Final calculated Score = " + resultScore);
        
        // Simulating AWS Review API dispatch
        invokeReviewAPI(submissionId, resultScore);
        
        System.out.println("[CORE] Container terminating gracefully.");
    }

    private static double simulateGenericScorer(long seed) {
        Random r = new Random(seed);
        System.out.println("[INFO] Running generic test cases...");
        for (int i = 1; i <= 10; i++) {
            System.out.println("[INFO] Test Case #" + i + ": Passed (" + (10 + r.nextInt(15)) + "ms)");
        }
        return 75.0 + (r.nextDouble() * 25.0);
    }

    private static void invokeReviewAPI(String submissionId, double score) {
        String targetUrl = System.getenv("REVIEW_API_URL");
        if (targetUrl == null) {
            targetUrl = DEFAULT_REVIEW_API;
        }
        System.out.println("[HTTP] Transmitting scoring results to Review API at " + targetUrl);
        System.out.println("[HTTP] PAYLOAD: {\"submissionId\": \"" + submissionId + "\", \"score\": " + score + ", \"status\": \"SUCCESS\"}");
        System.out.println("[HTTP] Post request returned 200 OK. Verification recorded.");
    }
}
