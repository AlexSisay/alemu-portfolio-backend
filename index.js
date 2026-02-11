const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');

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
// Free-tier models: gemini-2.5-flash, gemini-2.5-flash-lite, gemini-1.5-flash
let geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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

// CV Data - Updated Jan 2026
const cvData = {
  personal: {
    name: "Alemu Sisay Nigru",
    title: "AI Research Scientist & PhD Candidate in AI in Medicine",
    email: "alemu.nigru@unibs.it",
    location: "Italy",
    phone: "+39 351 844 3838",
    linkedin: "linkedin.com/in/alemu-sisay-nigru-23612514b",
    github: "github.com/alexsisay"
  },
  education: [
    {
      degree: "PhD, Artificial Intelligence in Medicine",
      institution: "University of Brescia, Italy",
      year: "2022-2025 (Expected)",
      focus: "AI-driven clinical decision support for personalized management of low back pain"
    },
    {
      degree: "MSc, Communication Technologies and Multimedia",
      institution: "University of Brescia, Italy",
      year: "2019-2022",
      focus: "110 cum laude/110 — Deep learning–based neuroimage retrieval"
    },
    {
      degree: "BSc, Electrical and Computer Engineering",
      institution: "University of Gondar, Ethiopia",
      year: "2012-2016",
      focus: "3.89/4.00 — Gold Medalist — Fingerprint-based Attendance System using ASP.NET and C#"
    }
  ],
  experience: [
    {
      title: "Visiting PhD Researcher",
      company: "Video Lab, New York University (NYU), USA",
      period: "Apr 2025 – Oct 2025",
      description: "Developed deep learning models for lumbar spine pathology detection from MRI. Conducted training, evaluation, and benchmarking of computer vision models on clinical datasets. Collaborated with multidisciplinary teams on imaging pipelines and model interpretability."
    },
    {
      title: "Visiting PhD Researcher",
      company: "Center for Digital Health and Implementation Science (CDHI), Ethiopia",
      period: "Sep 2024 – Dec 2024",
      description: "Deployed AI model APIs and contributed to frontend integration for clinical applications. Adapted AI tools for resource-constrained healthcare environments. Supported real-world validation of AI-based clinical decision support tools."
    },
    {
      title: "Assistant Lecturer",
      company: "Department of Electrical & Computer Engineering, University of Gondar, Ethiopia",
      period: "Aug 2016 – Aug 2019",
      description: "Taught undergraduate courses in C++ programming, digital logic design, circuit theory, and communication systems. Led community-based technology transfer and capacity-building initiatives."
    }
  ],
  skills: [
    "Python", "C++", "C#", "Matlab", "Java",
    "PyTorch", "TensorFlow", "Scikit-learn",
    "DICOM", "NIfTI", "PyDICOM", "Radiology AI",
    "MRI Segmentation & Classification", "CNNs", "Transformers",
    "Image Segmentation", "Feature Extraction",
    "NumPy", "OpenCV", "Git",
    "Medical Imaging AI", "Healthcare AI", "Computer Vision", "Risk Prediction"
  ],
  publications: [
    {
      title: "External validation of SpineNetV2 on a comprehensive set of radiological features for grading lumbosacral disc pathologies",
      journal: "North American Spine Society Journal (NASSJ)",
      year: "2024",
      doi: "Peer-Reviewed"
    },
    {
      title: "Toward a Clinically Integrated AI Framework for Personalized Spine Care",
      journal: "SSRN Preprint",
      year: "Under Review",
      doi: "Preprint"
    },
    {
      title: "Rewiring Development: Leveraging Adult Brain Priors for Enhancing Infant Brain MRI Segmentation",
      journal: "arXiv Preprint",
      year: "Preprint",
      doi: "Co-authored with M. Svanera et al."
    },
    {
      title: "LumbarAI: A Swin3D Transformer-Based Framework for Computer-Aided Diagnosis of Lumbar Spine Disorders from MRI",
      journal: "Under Review",
      year: "Under Review",
      doi: "Submitted"
    },
    {
      title: "Integrating Radiological Severity and Patient-Reported Outcomes for Risk Factor Identification in Spine Health",
      journal: "Under Review",
      year: "Under Review",
      doi: "Submitted"
    }
  ],
  projects: [
    {
      name: "Spine MRI Analysis with Deep Learning",
      description: "Developed CNN and transformer-based models for segmentation and grading of lumbar spine pathologies.",
      technologies: ["PyTorch", "Transformers", "CNNs", "MRI", "Computer Vision"]
    },
    {
      name: "Multimodal Risk Stratification in Spine Health",
      description: "Integrated radiological severity with psychosocial PROMs to identify patient risk profiles and support personalized treatment strategies.",
      technologies: ["Deep Learning", "Clinical Decision Support", "PROMs"]
    },
    {
      name: "Brain MRI Tissue Segmentation",
      description: "Built automated pipelines for segmentation of CSF, GM, WM, basal ganglia, and cerebrum from T1/T2 MRI scans.",
      technologies: ["PyTorch", "Medical Imaging", "Segmentation"]
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
    // Try Gemini first (if configured) - uses free-tier model (gemini-2.5-flash)
    if (gemini) {
      const modelsToTry = [geminiModel, 'gemini-1.5-flash', 'gemini-pro'];
      for (const modelName of modelsToTry) {
        try {
          const model = gemini.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(systemPrompt);
          const response = await result.response;
          return response.text();
        } catch (modelErr) {
          if (modelName === modelsToTry[modelsToTry.length - 1]) throw modelErr;
          console.warn(`Model ${modelName} failed, trying next:`, modelErr.message);
        }
      }
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
    return "Alemu's research focuses on AI-driven clinical decision support for personalized management of low back pain. He specializes in spine MRI analysis, multimodal data integration, and risk prediction using imaging and patient-reported outcomes. His PhD at the University of Brescia explores AI for spinal pathology diagnosis.";
  }
  
  if (lowerQuestion.includes('education') || lowerQuestion.includes('degree')) {
    return "Alemu holds a BSc in Electrical and Computer Engineering from the University of Gondar (2012-2016, Gold Medalist), an MSc in Communication Technologies and Multimedia from the University of Brescia (2019-2022, 110 cum laude), and is completing his PhD in Artificial Intelligence in Medicine at the University of Brescia (2022-2025).";
  }
  
  if (lowerQuestion.includes('skill') || lowerQuestion.includes('expertise')) {
    return "Alemu's technical skills include Python, PyTorch, TensorFlow, Scikit-learn, medical imaging (DICOM, NIfTI), CNNs, Transformers, MRI segmentation and classification. He works in Medical Imaging AI, Healthcare AI, Computer Vision, and Risk Prediction.";
  }
  
  if (lowerQuestion.includes('contact') || lowerQuestion.includes('email')) {
    return "You can contact Alemu at alemu.nigru@unibs.it or +39 351 844 3838. His LinkedIn is linkedin.com/in/alemu-sisay-nigru-23612514b. He's based in Italy and available for research collaborations.";
  }
  
  if (lowerQuestion.includes('publication') || lowerQuestion.includes('paper')) {
    return "Alemu has a peer-reviewed paper in NASSJ (2024) on SpineNetV2 validation for lumbosacral disc pathologies. He also has preprints on SSRN and arXiv, plus papers under review on LumbarAI (Swin3D framework) and integrating radiological severity with patient-reported outcomes for spine health.";
  }
  
  if (lowerQuestion.includes('project')) {
    return "Alemu's key projects include: Spine MRI Analysis with deep learning (CNN/transformer models for lumbar pathology grading), Multimodal Risk Stratification in spine health (integrating imaging with PROMs), and Brain MRI Tissue Segmentation (automated pipelines for CSF, GM, WM segmentation).";
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
    model: aiProvider === 'gemini' ? geminiModel : (aiProvider === 'openai' ? 'gpt-3.5-turbo' : 'fallback'),
    available: !!(gemini || openai),
    fallback: !(gemini || openai)
  });
});

// Dashboard analytics
app.get('/api/dashboard', async (req, res) => {
  let blogCount = 0;
  try {
    const Blog = require('./models/Blog');
    blogCount = await Blog.countDocuments();
  } catch (e) {
    // MongoDB may not be connected yet
  }
  const analytics = {
    totalPublications: cvData.publications.length,
    totalProjects: cvData.projects.length,
    yearsOfExperience: 8,
    blogPosts: blogCount,
    skills: cvData.skills.length,
    researchAreas: ["Medical Imaging AI", "Healthcare AI", "Computer Vision", "Risk Prediction"]
  };
  res.json(analytics);
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Mount new API routes
app.use('/api/admin', require('./routes/auth'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/content', require('./routes/content'));

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