const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// AI Integration - Multiple Providers
let aiProvider = process.env.AI_PROVIDER || 'gemini';

// Initialize AI clients based on provider
let openai = null;
let gemini = null;

if (aiProvider === 'openai' && process.env.OPENAI_API_KEY) {
  const OpenAI = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else if (aiProvider === 'gemini' && process.env.GEMINI_API_KEY) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.log('No AI provider configured, using fallback responses');
}

// CV Data - This would be extracted from your actual CVs
const cvData = {
  personal: {
    name: "Alemu Sisay Nigru",
    title: "AI Researcher & Academic",
    email: "alemu.nigru@unibs.it",
    location: "Italy",
    phone: "+39 3518443838",
    linkedin: "linkedin.com/in/alemu-sisay",
    github: "github.com/alexsisay"
  },
  education: [
    {
      degree: "PhD, Artificial Intelligence in Medicine",
      institution: "University of Brescia",
      year: "2022-2025",
      focus: "Artificial Intelligence, Machine Learning, Medical Imaging"
    },
    {
      degree: "MSc, Communication Technologies and Multimedia",
      institution: "University of Brescia",
      year: "2019-2022",
      focus: "Multimedia Engineering, AI, Computer Vision"
    }
  ],
  experience: [
    {
      title: "AI Research Scientist",
      company: "Research Institution",
      period: "2022-Present",
      description: "Leading research in AI and machine learning applications"
    },
    {
      title: "Teaching Assistant",
      company: "University",
      period: "2020-2022",
      description: "Assisted in teaching AI and computer science courses"
    }
  ],
  skills: [
    "Machine Learning", "Deep Learning", "Python", "TensorFlow", "PyTorch",
    "Natural Language Processing", "Computer Vision", "Data Science",
    "Research Methodology", "Academic Writing"
  ],
  publications: [
    {
      title: "Advanced AI Applications in Healthcare",
      journal: "AI Research Journal",
      year: "2024",
      doi: "10.1000/example"
    }
  ],
  projects: [
    {
      name: "AI-Powered Healthcare System",
      description: "Developed machine learning models for disease prediction",
      technologies: ["Python", "TensorFlow", "Scikit-learn"]
    }
  ]
};

// AI Agent function with multiple provider support
async function getAIResponse(userQuestion) {
  const systemPrompt = `You are an AI assistant for Alemu Sisay Nigru's academic portfolio. 
  You have access to the following information about Alemu:
  
  Personal: ${JSON.stringify(cvData.personal)}
  Education: ${JSON.stringify(cvData.education)}
  Experience: ${JSON.stringify(cvData.experience)}
  Skills: ${JSON.stringify(cvData.skills)}
  Publications: ${JSON.stringify(cvData.publications)}
  Projects: ${JSON.stringify(cvData.projects)}
  
  Answer questions about Alemu's academic and professional background based on this information. 
  Be professional, concise, and helpful. If you don't have information about something, say so politely.
  
  User question: ${userQuestion}`;

  try {
    // Try Gemini first (if configured)
    if (gemini) {
      const model = gemini.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      return response.text();
    }
    
    // Fallback to OpenAI (if configured)
    if (openai) {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuestion }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });
      return completion.choices[0].message.content;
    }
    
    // Fallback responses if no AI provider is configured
    return getFallbackResponse(userQuestion);
    
  } catch (error) {
    console.error('AI API Error:', error);
    return getFallbackResponse(userQuestion);
  }
}

// Fallback responses when AI is not available
function getFallbackResponse(question) {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('research') || lowerQuestion.includes('focus')) {
    return "Alemu's research focuses on Artificial Intelligence in Medicine, particularly in medical imaging and healthcare applications. He is currently pursuing a PhD at the University of Brescia in AI for medical applications.";
  }
  
  if (lowerQuestion.includes('education') || lowerQuestion.includes('degree')) {
    return "Alemu holds an MSc in Communication Technologies and Multimedia from the University of Brescia (2019-2022) and is currently pursuing a PhD in Artificial Intelligence in Medicine at the same university (2022-2025).";
  }
  
  if (lowerQuestion.includes('skill') || lowerQuestion.includes('expertise')) {
    return "Alemu's technical skills include Machine Learning, Deep Learning, Python, TensorFlow, PyTorch, Natural Language Processing, Computer Vision, and Data Science. He specializes in AI applications for healthcare.";
  }
  
  if (lowerQuestion.includes('contact') || lowerQuestion.includes('email')) {
    return "You can contact Alemu at alemu.nigru@unibs.it or through his LinkedIn profile at linkedin.com/in/alemu-sisay. He's based in Italy and available for research collaborations.";
  }
  
  if (lowerQuestion.includes('publication') || lowerQuestion.includes('paper')) {
    return "Alemu has published research papers in AI and healthcare applications. His work focuses on developing AI solutions for medical imaging and disease prediction.";
  }
  
  if (lowerQuestion.includes('project')) {
    return "Alemu has worked on several AI projects, including an AI-powered healthcare system for disease prediction using machine learning models developed with Python, TensorFlow, and Scikit-learn.";
  }
  
  return "I apologize, but I'm having trouble accessing my knowledge base right now. Please try asking about Alemu's research focus, education, skills, publications, or contact information. You can also reach out to him directly at alemu.nigru@unibs.it.";
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    aiProvider: aiProvider,
    aiAvailable: !!(gemini || openai)
  });
});

app.get('/api/profile', (req, res) => {
  res.json(cvData);
});

app.post('/api/ai-chat', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const response = await getAIResponse(question);
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI Provider status endpoint
app.get('/api/ai-status', (req, res) => {
  res.json({
    provider: aiProvider,
    available: !!(gemini || openai),
    fallback: !(gemini || openai)
  });
});

// Blog data
const blogPosts = [
  {
    id: 1,
    title: "The Future of AI in Academic Research",
    excerpt: "Exploring how artificial intelligence is transforming research methodologies across disciplines...",
    content: "Artificial Intelligence is revolutionizing the way we conduct academic research. From data analysis to literature reviews, AI tools are becoming indispensable for researchers worldwide. In this post, I'll share insights from my own research experience and discuss emerging trends in AI-powered academic workflows.",
    author: "Alemu Sisay Nigru",
    date: "2024-01-15",
    tags: ["AI", "Research", "Academic"]
  },
  {
    id: 2,
    title: "Machine Learning Applications in Healthcare",
    excerpt: "A comprehensive overview of ML applications in modern healthcare systems...",
    content: "Healthcare is one of the most promising domains for machine learning applications. From diagnostic imaging to drug discovery, ML algorithms are helping medical professionals make better decisions and improve patient outcomes. This post explores current applications and future possibilities.",
    author: "Alemu Sisay Nigru",
    date: "2024-01-10",
    tags: ["ML", "Healthcare", "AI"]
  },
  {
    id: 3,
    title: "Building Effective AI Research Teams",
    excerpt: "Lessons learned from leading AI research projects and managing diverse teams...",
    content: "Success in AI research often depends on having the right team composition and management approach. In this post, I share strategies for building effective AI research teams, including skill diversity, communication practices, and project management techniques.",
    author: "Alemu Sisay Nigru",
    date: "2024-01-05",
    tags: ["Leadership", "Research", "Team Management"]
  }
];

app.get('/api/blog', (req, res) => {
  res.json(blogPosts);
});

app.get('/api/blog/:id', (req, res) => {
  const post = blogPosts.find(p => p.id === parseInt(req.params.id));
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

// Dashboard analytics
app.get('/api/dashboard', (req, res) => {
  const analytics = {
    totalPublications: cvData.publications.length,
    totalProjects: cvData.projects.length,
    yearsOfExperience: 5,
    blogPosts: blogPosts.length,
    skills: cvData.skills.length,
    researchAreas: ["AI", "ML", "Healthcare", "Education"]
  };
  res.json(analytics);
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Catch all handler for React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`AI Provider: ${aiProvider}`);
  console.log(`AI Available: ${!!(gemini || openai)}`);
  console.log(`AI Agent ready for questions about Alemu's experience`);
}); 