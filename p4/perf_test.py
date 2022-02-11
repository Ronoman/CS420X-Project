#!/usr/bin/env python3

import subprocess, time

import numpy as np
from matplotlib import pyplot as plt

from selenium import webdriver

def main():
  num_tests = int(input("Number of tests to run: "))
  duration = int(input("Test duration: "))
  low = int(input("Agent count low: "))
  high = int(input("Agent count high: "))

  agent_counts = np.linspace(low, high, num=num_tests)
  avg_load = []

  SAMPLE_HZ = 5

  for count in agent_counts:
    with open("render.js", "+") as f:
      lines = f.readlines()

      lines[0] = f"let agentCount = {count}"

      f.truncate()
      f.writelines(lines)

    load_pct = []

    for i in range(SAMPLE_HZ * duration):
      smi = subprocess.check_output(["nvidia-smi"]).decode("utf-8")

      # Abomination to grab GPU % out of command line output
      row = smi.split("\n")[9].split("|")[-2].split(" ")
      less = [elem for elem in row if not elem == ""]
      pct = int(less[0][:-1])

      load_pct.append(pct)

      print(less)

      time.sleep(1 / SAMPLE_HZ)

    avg_load.append(sum(load_pct) / len(load_pct))

  plt.scatter(agent_counts, avg_load)
  plt.xlabel("Agent count")
  plt.ylabel("Load pct (as reported by nvidia-smi)")

  plt.show()

if __name__ == "__main__":
  main()