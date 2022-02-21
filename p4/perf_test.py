#!/usr/bin/env python3

import subprocess, time, os

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

  SAMPLE_HZ = 10

  for count in agent_counts:
    with open("./agent_count.js", "w+") as f:
      f.write(f"var agentCount = {count}")

    browser = webdriver.Firefox(executable_path="./geckodriver")
    browser.fullscreen_window()
    time.sleep(2)
    browser.get("file:///home/ronoman/Repos/CS420X-Project/p4/p4.html")

    time.sleep(20)

    x = []
    load_pct = []

    for i in range(SAMPLE_HZ * duration):
      smi = subprocess.check_output(["nvidia-smi"]).decode("utf-8")

      # Abomination to grab GPU % out of command line output
      row = smi.split("\n")[9].split("|")[-2].split(" ")
      less = [elem for elem in row if not elem == ""]
      pct = int(less[0][:-1])

      load_pct.append(pct)
      x.append(i)

      time.sleep(1 / SAMPLE_HZ)

    avg_load.append(sum(load_pct) / len(load_pct))

    print(f"Count: {count}")
    print(f"Load: {avg_load[-1]}")
    print()

    browser.close()

  plt.scatter(agent_counts, avg_load)
  plt.title("Agent Count Impact on GPU Load % (reported by nvidia-smi)")
  plt.xlabel("Agent count")
  plt.ylabel("Load %")

  plt.show()

if __name__ == "__main__":
  main()