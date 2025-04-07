// hooks/useSignalQuality.ts
import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';

interface SignalQualityResults {
  signalQuality: string;
  qualityConfidence: number;
}
export default function useSignalQuality(
  ppgData: number[]
): SignalQualityResults {
  const modelRef = useRef<tf.LayersModel | null>(null);
  const [signalQuality, setSignalQuality] = useState<string>('--');
  const [qualityConfidence, setQualityConfidence] = useState<number>(0);

  // Load TensorFlow.js model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tf.loadLayersModel('/tfjs_model/model.json');
        modelRef.current = loadedModel;
        console.log('PPG quality assessment model loaded successfully');
      } catch (error) {
        console.error('Error loading model:', error);
      }
    };

    loadModel();
  }, []);

  useEffect(() => {
    if (ppgData.length >= 100) {
      assessSignalQuality(ppgData);
    }
  }, [ppgData]);

  const assessSignalQuality = async (signal: number[]) => {
    if (!modelRef.current || signal.length < 100) return;

    try {
      const features = calculateFeatures(signal);
      const inputTensor = tf.tensor2d([features]);
      const prediction = (await modelRef.current.predict(
        inputTensor
      )) as tf.Tensor;
      const probabilities = await prediction.data();

      const classIndex = probabilities.indexOf(Math.max(...probabilities));
      const classes = ['bad', 'acceptable', 'excellent'];
      const predictedClass = classes[classIndex];
      const confidence = probabilities[classIndex] * 100;

      setSignalQuality(predictedClass);
      setQualityConfidence(confidence);

      inputTensor.dispose();
      prediction.dispose();
    } catch (error) {
      console.error('Error assessing signal quality:', error);
    }
  };

  const calculateFeatures = (signal: number[]): number[] => {
    if (!signal.length) return new Array(19).fill(0);
  
    // Basic statistics
    const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
    const std = Math.sqrt(signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length);
    const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;
    const rms = Math.sqrt(signal.reduce((sum, val) => sum + val * val, 0) / signal.length);
    const signalMin = Math.min(...signal);
    const signalMax = Math.max(...signal);
    const signalRange = signalMax - signalMin;
  
    // Quartiles (Q1, Q2=median, Q3)
    const q1 = percentile(signal, 25);
    const q2 = percentile(signal, 50); // Median
    const q3 = percentile(signal, 75);
  
    // Higher-order statistics
    const diff = signal.map(val => val - mean);
    const skewness = diff.reduce((sum, val) => sum + Math.pow(val, 3), 0) / signal.length / Math.pow(std, 3);
    const kurtosis = diff.reduce((sum, val) => sum + Math.pow(val, 4), 0) / signal.length / Math.pow(std, 4);
  
    // Perfusion (approximation)
    const perfusion = (signalMax - signalMin) / (Math.abs(mean) + 1e-7) * 100;
  
    // Entropy (approximation)
    const squaredSignal = signal.map(val => val * val);
    const epsilon = 1e-10;
    const entropy = -squaredSignal.reduce((sum, val) => sum + val * Math.log(val + epsilon), 0) / signal.length;
  
    // Zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < signal.length; i++) {
      if ((signal[i] >= 0 && signal[i - 1] < 0) || (signal[i] < 0 && signal[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / signal.length;
  
      // SNR Ratio (approximation)
      const absSignal = signal.map(val => Math.abs(val));
      const snrRatio = variance / (absSignal.reduce((sum, val) => sum + val * val, 0) / signal.length + 1e-7);
  
    // FFT Features (Simplified - requires a separate FFT library for accurate calculation)
    // In this example, we are just adding placeholders.  For real FFT features, you'd need to use a library.
    const fftEnergy = 0; // Placeholder
    const fftVariance = 0; // Placeholder
    const fftSum = 0; // Placeholder
  
    return [
      fftEnergy,
      fftVariance,
      fftSum,
      mean,
      q1,
      q2,
      q3,
      signalMin,
      signalMax,
      std,
      signalRange,
      variance,
      rms,
      perfusion,
      skewness,
      kurtosis,
      entropy,
      zeroCrossingRate,
      snrRatio
    ];
  };
  
  // Helper function to calculate percentile
  function percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const fraction = index - lower;
    return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
  }
  
  return { signalQuality, qualityConfidence };
}