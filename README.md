# HeartLens 🫀

HeartLens is a modern web application that uses your device's camera to measure heart rate and heart rate variability (HRV) through Photoplethysmography (PPG) signal processing.

## Features ✨

- **Real-time PPG Signal Processing**: Captures and analyzes PPG signals through your device's camera
- **Live Metrics**:
  - Heart Rate (BPM)
  - Heart Rate Variability (HRV)
  - Signal Quality Monitoring
- **User Management**: Personal profiles with historical data tracking
- **Data Recording**: Start/stop recording functionality
- **Automatic Sampling**: Save data to MongoDB every 10 seconds
- **Signal Customization**: Multiple PPG signal combination options
- **Modern UI**: Clean, responsive interface with real-time visualizations

## Technical Stack 🛠

- **Frontend**: Next.js 13+ with App Router
- **Styling**: Tailwind CSS
- **Data Visualization**: Chart.js
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Real-time Processing**: Canvas API for video processing

## Getting Started 🚀

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/heartlens.git
   cd heartlens
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Add your MongoDB connection string and other required variables.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide 📖

1. **User Authentication**:
   - Enter your name/ID
   - Click "Confirm User" to proceed

2. **Recording**:
   - Click "START RECORDING" to begin camera feed
   - Wait for signal quality to stabilize
   - Use "START SAMPLING" to automatically save data

3. **Signal Configuration**:
   - Click "Show Config" to access signal options
   - Choose from various PPG signal combinations

4. **Data Management**:
   - View real-time metrics and PPG signal graph
   - Data is automatically saved every 10 seconds when sampling
   - Manual save option available via "Save Data to MongoDB"

## Requirements 📋

- Modern web browser with camera access
- Good lighting conditions for optimal PPG signal
- Stable internet connection for data saving
- MongoDB database (for data storage)

## Privacy and Security 🔒

- Camera feed is processed locally
- No video data is stored or transmitted
- Only processed PPG data and metrics are saved
- User data is stored securely in MongoDB

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments 🙏

- PPG signal processing algorithms
- Chart.js for visualization
- Tailwind CSS for styling
- Next.js team for the framework
