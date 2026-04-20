/**
 * Default starter code per language — Bubble Sort.
 * Written to be cleanly transpilable by /services/transpiler.js
 */
export const LANGUAGE_TEMPLATES = {
  javascript: `// Bubble Sort — JavaScript
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

const array = [64, 34, 25, 12, 22, 11, 90];
bubbleSort(array);
console.log(array);`,

  python: `# Bubble Sort — Python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

array = [64, 34, 25, 12, 22, 11, 90]
bubble_sort(array)`,

  java: `// Bubble Sort — Java
public class BubbleSort {
    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }

    public static void main(String[] args) {
        int[] array = {64, 34, 25, 12, 22, 11, 90};
        bubbleSort(array);
    }
}`,

  cpp: `// Bubble Sort — C++
#include <iostream>
#include <vector>

void bubbleSort(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    std::vector<int> array = {64, 34, 25, 12, 22, 11, 90};
    bubbleSort(array);
    return 0;
}`,
};
