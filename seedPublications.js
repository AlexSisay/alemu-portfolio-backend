#!/usr/bin/env node
/**
 * Seed initial publications. Run: node seedPublications.js
 * Requires MONGODB_URI in .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Publication = require('./models/Publication');

const initialPublications = [
  {
    year: 2026,
    status: 'Under Review',
    title: 'Unsupervised Clustering of Psychosocial Profiles for Patient Stratification in Spinal Pain Management',
    authors: 'Alemu Sisay Nigru, Federico Maffezzoni, Sergio Benini, Serena Miglio, Matteo Bonetti, Michele Frigerio, Graziella Bragaglio, Chiara D\'Adda, Riccardo Leonardi',
    journal: 'Under Review',
    highlights: [
      'Identified two distinct biopsychosocial phenotypes: Adaptive (60%) and Maladaptive (40%)—independent of structural pathology.',
      'Maladaptive phenotype marked by severe pain, high disability, reduced quality of life, and predominant avoidance coping.',
      'Four-variable screening tool accurately discriminates Maladaptive phenotype (AUC = 0.950) for mechanism-informed, stratified spine care.',
    ],
    abstract: 'Background Context: Chronic spinal pain is highly heterogeneous...',
    link: '',
  },
  {
    year: 2026,
    status: 'Under Review',
    title: 'Organization of Coping Strategies and Their Proximal Associations with Pain Intensity in Spinal Pain Patients',
    authors: 'Alemu Sisay Nigru, Federico Maffezzoni, Sergio Benini, Serena Miglio, Matteo Bonetti, Michele Frigerio, Graziella Bragaglio, Chiara D\'Adda, Riccardo Leonardi',
    journal: 'Under Review',
    highlights: [
      'Avoidance and Positive Attitude are the only coping dimensions independently associated with pain intensity, explaining 41.4% of variance.',
      'Other strategies (Social Support, Problem Orientation) relate to pain via indirect pathways through these proximal dimensions.',
      'Three coping profiles identified: Adaptive Copers (lowest pain), Moderate Copers, and Maladaptive Copers (highest pain).',
    ],
    abstract: 'Background: Although coping strategies are well-established...',
    link: '',
  },
  {
    year: 2025,
    status: 'Published',
    title: 'Rewiring Development in Brain Segmentation: Leveraging Adult Brain Priors for Enhancing Infant MRI Segmentation',
    authors: 'Alemu Sisay Nigru, Michele Svanera, Austin Dibble, Connor Dalby, Mattia Savardi, Sergio Benini',
    journal: 'arXiv preprint arXiv:2510.09306',
    highlights: [
      'LODi framework transfers anatomical knowledge from adult brain MRI to infant scans via transfer learning and domain adaptation.',
      'Pre-trained on 27k adult scans; adapted to 0–2 year-old population using weakly supervised learning with Infant FreeSurfer labels.',
      'Outperforms traditional supervised and domain-specific models on internal and external datasets; robust to motion artifacts.',
    ],
    abstract: 'Accurate segmentation of infant brain MRI is critical...',
    link: 'https://arxiv.org/pdf/2510.09306',
  },
  {
    year: 2025,
    status: 'Published',
    title: 'Toward a Clinically Integrated AI Framework for Personalized Spine Care',
    authors: 'Alemu Sisay Nigru, Sergio Benini, Yao Wang, Federico Maffezzoni, Matteo Bonetti, Michele Frigerio, Graziella Bragaglio, Serena Miglio, R Leonardi',
    journal: 'Available at SSRN 5860785',
    highlights: [
      'Modular AI framework unifies imaging analysis, patient-reported outcomes, and clinical reasoning in a single ecosystem.',
      'Three modules: automated imaging grading with radiologist-in-the-loop, multimodal PROM assessment, and LLM-based report generation.',
      'Proof-of-concept shows combining AI imaging findings with PROMs can shift treatment recommendations beyond imaging alone.',
    ],
    abstract: 'Background and Objective: Low back pain remains...',
    link: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5860785',
  },
  {
    year: 2024,
    status: 'Published',
    title: 'External validation of SpineNetV2 on a comprehensive set of radiological features for grading lumbosacral disc pathologies',
    authors: 'Alemu Sisay Nigru MSc, Sergio Benini PhD, Matteo Bonetti MD, Graziella Bragaglio MSc, Michele Frigerio MD, Federico Maffezzoni MSc, Riccardo Leonardi PhD',
    journal: 'North American Spine Society Journal (NASSJ)',
    highlights: [
      'Retrospective analysis of 1747 lumbosacral IVDs from 353 patients; SpineNetV2 graded 11 distinct disc pathologies.',
      'Strong performance with high agreement (Cohen\'s Kappa, Lin\'s Concordance, MCC > 0.7) for most pathologies.',
      'Lower agreement for foraminal stenosis and disc herniation—underscores limitations of sagittal MR images for these conditions.',
    ],
    abstract: 'Background: In recent years, the integration of AI models...',
    link: 'https://www.sciencedirect.com/science/article/pii/S2666548424002579',
  },
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await Publication.countDocuments();
    if (count > 0) {
      console.log(`Publications collection already has ${count} entries. Skipping seed.`);
      process.exit(0);
    }
    await Publication.insertMany(initialPublications);
    console.log(`Seeded ${initialPublications.length} publications.`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}
seed();
