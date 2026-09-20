import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '../utils/Icons';

export default function Home() {
  const tools = [
    {
      id: 'image',
      title: 'Image Tools',
      description: 'Compress, resize, and convert images (JPG, PNG, WebP, AVIF).',
      icon: <Icons.Image />,
      path: '/image',
      color: 'pink',
    },
    {
      id: 'video',
      title: 'Video Tools',
      description: 'Compress, trim duration, and resize aspect ratio for videos.',
      icon: <Icons.Video />,
      path: '/video',
      color: 'blue',
    },
    {
      id: 'audio',
      title: 'Audio Tools',
      description: 'Compress, trim, format and enhance your audio files.',
      icon: <Icons.Music />,
      path: '/audio',
      color: 'purple',
    },
    {
      id: 'pdf',
      title: 'PDF Tools',
      description: 'Compress PDFs, and delete or rearrange specific pages.',
      icon: <Icons.Document />,
      path: '/pdf',
      color: 'green',
    },
    {
      id: 'merge',
      title: 'Merge Templates',
      description: 'Merge multiple images or PDFs into a single document.',
      icon: <Icons.Layers />,
      path: '/merge',
      color: 'purple',
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="home-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="home-header">
        <h2>Select a Tool</h2>
        <p>Choose the type of file you want to process to access specialized tools.</p>
      </div>

      <motion.div 
        className="tools-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {tools.map((tool) => (
          <motion.div variants={itemVariants} key={tool.id}>
            <Link to={tool.path} className={`tool-card tool-card-${tool.color}`}>
              <div className="tool-icon-wrapper">
                {tool.icon}
              </div>
              <div className="tool-content">
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
              </div>
              <div className="tool-arrow">
                <Icons.ArrowRight />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Features Section */}
      <motion.div 
        className="features-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className="features-header">
          <h3>Why Choose SHIZEN?</h3>
          <p>Experience the best in local file processing.</p>
        </div>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon"><Icons.Shield /></div>
            <h4>100% Private</h4>
            <p>All processing happens locally on your device. Your files never leave your computer.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><Icons.Zap /></div>
            <h4>Lightning Fast</h4>
            <p>Leveraging your device's native power to process files without upload/download delays.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><Icons.Layers /></div>
            <h4>All-in-One</h4>
            <p>Compress, convert, and edit images, videos, audio, and PDFs in one place.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
