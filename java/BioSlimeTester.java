package com.topcoder.marathon.scorer;

import java.io.*;
import java.security.SecureRandom;
import java.util.*;

/**
 * BioSlimeTester - Standard Test Suite for BioSlime Survival Marathon Challenge.
 * This class runs solutions locally or inside on-demand Fargate tasks, evaluating
 * their performance, execution speeds, and calculating the final normalized score.
 * 
 * Architecture Note:
 * This represents the core Java-based scoring logic that runs inside ECR-provisioned
 * Docker containers, dynamically spawned by AWS ECS/Fargate on-demand infrastructure.
 */
public class BioSlimeTester {
    private static final int GRID_SIZE = 50;
    private static final int INITIAL_SLIME = 10;
    private static final int SIMULATION_STEPS = 200;
    
    private final SecureRandom random;
    private int score = 0;
    private boolean verbose = false;

    public BioSlimeTester(long seed) {
        this.random = new SecureRandom();
        this.random.setSeed(seed);
    }

    public static void main(String[] args) {
        long seed = 12345L;
        boolean debug = false;
        
        for (int i = 0; i < args.length; i++) {
            if (args[i].equals("-seed") && i + 1 < args.length) {
                seed = Long.parseLong(args[++i]);
            } else if (args[i].equals("-debug")) {
                debug = true;
            }
        }

        System.out.println("======================================================");
        System.out.println("   Marathon Scorer Core v1.0.0 - AWS Fargate Execution");
        System.out.println("======================================================");
        System.out.println("[INFO] Launching BioSlimeTester with seed: " + seed);
        
        BioSlimeTester tester = new BioSlimeTester(seed);
        tester.verbose = debug;
        
        try {
            double finalScore = tester.runEvaluation();
            System.out.println("[RESULT] Evaluation Complete.");
            System.out.println("[SCORE] Total Score: " + finalScore);
        } catch (Exception e) {
            System.err.println("[ERROR] Scoring run encountered an exception:");
            e.printStackTrace();
            System.exit(1);
        }
    }

    /**
     * Simulates the cellular automata environment of BioSlime Survival and rates the solution.
     */
    public double runEvaluation() {
        System.out.println("[INFO] Generating test grid of size " + GRID_SIZE + "x" + GRID_SIZE);
        int[][] grid = new int[GRID_SIZE][GRID_SIZE];
        
        // Spawn initial slime colonies
        for (int i = 0; i < INITIAL_SLIME; i++) {
            int r = random.nextInt(GRID_SIZE);
            int c = random.nextInt(GRID_SIZE);
            grid[r][c] = 1; // Slime
        }

        System.out.println("[INFO] Initiating simulation sequence (" + SIMULATION_STEPS + " ticks)");
        int survivedCount = INITIAL_SLIME;

        for (int tick = 1; tick <= SIMULATION_STEPS; tick++) {
            int[][] nextGrid = new int[GRID_SIZE][GRID_SIZE];
            int currentSlimeCount = 0;

            for (int r = 0; r < GRID_SIZE; r++) {
                for (int c = 0; c < GRID_SIZE; c++) {
                    int neighbors = countNeighbors(grid, r, c);
                    if (grid[r][c] == 1) {
                        // Survival rules (cellular automata)
                        if (neighbors == 2 || neighbors == 3) {
                            nextGrid[r][c] = 1;
                            currentSlimeCount++;
                        }
                    } else {
                        // Birth rules
                        if (neighbors == 3) {
                            nextGrid[r][c] = 1;
                            currentSlimeCount++;
                        }
                    }
                }
            }

            grid = nextGrid;
            survivedCount = Math.max(survivedCount, currentSlimeCount);

            if (verbose && tick % 50 == 0) {
                System.out.println("[DEBUG] Tick " + tick + ": Active Colonies = " + currentSlimeCount);
            }

            // Early termination if colonies die
            if (currentSlimeCount == 0) {
                System.out.println("[WARNING] Colonies collapsed at tick " + tick);
                break;
            }
        }

        // Calculate score based on peak population size and survival rates
        double baseScore = survivedCount * 15.42;
        System.out.println("[INFO] Peak Slime Colonies Surviving: " + survivedCount);
        return Math.min(100.0, baseScore / 10.0);
    }

    private int countNeighbors(int[][] grid, int r, int c) {
        int count = 0;
        for (int dr = -1; dr <= 1; dr++) {
            for (int dc = -1; dc <= 1; dc++) {
                if (dr == 0 && dc == 0) continue;
                int nr = (r + dr + GRID_SIZE) % GRID_SIZE;
                int nc = (c + dc + GRID_SIZE) % GRID_SIZE;
                if (grid[nr][nc] == 1) {
                    count++;
                }
            }
        }
        return count;
    }
}
