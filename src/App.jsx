import React, { useEffect } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import { loadFFmpeg } from './lib/ffmpeg';
import Header from './components/Header';
import Welcome from './components/Welcome';
import VideoPlayer from './components/VideoPlayer';
import TranscriptEditor from './components/TranscriptEditor';
import Timeline from './components/Timeline';
import ExportPanel from './components/ExportPanel';

function AppContent() {
  const { videoFile, setVideoFile, setFfmpegLoaded, isPlaying, setIsPlaying, currentTime, setCurrentTime, videoDuration } = useEditor();

  useEffect(() => {
    // Check for dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true' || (!savedDarkMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }

    // Load FFmpeg on mount
    loadFFmpeg()
      .then(() => {
        setFfmpegLoaded(true);
        console.log('FFmpeg loaded successfully');
      })
      .catch(error => {
        console.error('Failed to load FFmpeg:', error);
        alert('FFmpeg failed to load. The app may not work correctly. Please refresh the page.');
      });
  }, [setFfmpegLoaded]);

  // Bridge: let the static landing (index.html #landing) hand off files / launch the editor
  useEffect(() => {
    // expose handoff for the landing's vanilla JS (indexxfront upload zone)
    window.cutOpenFile = (file) => {
      if (!file) return;
      setVideoFile(file);
      // hide landing, show editor
      const landing = document.getElementById('landing');
      const root = document.getElementById('root');
      if (landing) landing.style.display = 'none';
      if (root) root.style.display = 'block';
      document.body.style.background = '#ffffff';
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    const onLaunch = () => {
      const landing = document.getElementById('landing');
      const root = document.getElementById('root');
      if (landing) landing.style.display = 'none';
      if (root) root.style.display = 'block';
      document.body.style.background = '#ffffff';
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('cut:launch-editor', onLaunch);
    // if user lands directly on editor via hash, hide landing
    if (window.location.hash === '#editor') onLaunch();
    return () => {
      window.removeEventListener('cut:launch-editor', onLaunch);
      // keep cutOpenFile for refresh? delete to avoid leaks
      try { delete window.cutOpenFile; } catch {}
    };
  }, [setVideoFile]);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyPress = (e) => {
      // Space - Play/Pause
      if (e.code === 'Space' && videoFile && !e.target.matches('input, textarea')) {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
      
      // Arrow keys - Seek
      if (e.code === 'ArrowLeft' && videoFile && !e.target.matches('input, textarea')) {
        e.preventDefault();
        setCurrentTime(Math.max(0, currentTime - 5));
      }
      
      if (e.code === 'ArrowRight' && videoFile && !e.target.matches('input, textarea')) {
        e.preventDefault();
        setCurrentTime(Math.min(videoDuration, currentTime + 5));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [videoFile, isPlaying, setIsPlaying, currentTime, setCurrentTime, videoDuration]);

  if (!videoFile) {
    return (
      <div className="min-h-screen bg-background">
        <Welcome />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Transcript Editor */}
          <div className="lg:col-span-1 h-[calc(100vh-120px)]">
            <TranscriptEditor />
          </div>

          {/* Right Column - Video Player, Timeline, Export */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <VideoPlayer />

            {/* Timeline */}
            <Timeline />

            {/* Export Panel */}
            <ExportPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <EditorProvider>
      <AppContent />
    </EditorProvider>
  );
}

export default App;
