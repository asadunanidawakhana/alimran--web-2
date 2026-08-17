'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Check,
  Download,
  Eye,
  FileText,
  Layers,
  X,
  Key,
  ShieldAlert,
  BookOpen,
  Atom,
  Calculator,
  FlaskConical,
  CheckSquare,
  Square,
  Globe,
  Languages,
} from 'lucide-react';
import {
  getStoredApiKey,
  detectQuestionsFromImage,
  solveSelectedQuestions,
  validateMediumLanguage,
  SubjectType,
  StudyMedium,
  DetectedQuestion,
  SolvedQuestionItem,
  AnalyzedNoteResult,
} from '@/lib/gemini';
import { renderMultiNoteImage, downloadDataUrlAsPng } from '@/lib/noteRenderer';
import { showToast } from '@/components/ToastNotification';
import ApiKeyModal from '@/components/ai/ApiKeyModal';

const SUBJECTS: { type: SubjectType; title: string; desc: string; icon: any; color: string; bg: string; border: string }[] = [
  {
    type: 'English Grammar',
    title: 'English Grammar',
    desc: 'Tenses, sentence structures, active/passive voice, direct/indirect.',
    icon: BookOpen,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    type: 'Physics',
    title: 'Physics',
    desc: 'Definitions, formulas, SI units, derivations, numerical problems.',
    icon: Atom,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  {
    type: 'Mathematics',
    title: 'Mathematics',
    desc: 'Equations, formulas, proofs, geometry, step-by-step numericals.',
    icon: Calculator,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    type: 'Chemistry',
    title: 'Chemistry',
    desc: 'Reactions, balanced equations, definitions, chemical stoichiometry.',
    icon: FlaskConical,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
];

interface UploadedImageItem {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export default function AiNoteGeneratorPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow Steps: 'subject' | 'medium' | 'upload' | 'detecting' | 'select-questions' | 'confirm-mode' | 'solving' | 'results'
  const [currentStep, setCurrentStep] = useState<
    'subject' | 'medium' | 'upload' | 'detecting' | 'select-questions' | 'confirm-mode' | 'solving' | 'results'
  >('subject');

  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('English Grammar');
  const [selectedMedium, setSelectedMedium] = useState<StudyMedium>('English Medium');
  const [images, setImages] = useState<UploadedImageItem[]>([]);
  const [detectedQuestions, setDetectedQuestions] = useState<DetectedQuestion[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<'short' | 'long'>('short');
  const [isUnclear, setIsUnclear] = useState(false);
  const [unclearNote, setUnclearNote] = useState('');
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  // Results state
  const [solvedNote, setSolvedNote] = useState<AnalyzedNoteResult | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Upload Files Handler
  const processFiles = async (files: FileList | File[]) => {
    const newItems: UploadedImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        showToast({ type: 'warning', title: 'Unsupported File', message: `${file.name} is not an image.` });
        continue;
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      newItems.push({
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
        mimeType: file.type || 'image/jpeg',
      });
    }

    if (newItems.length > 0) {
      setImages((prev) => [...prev, ...newItems]);
      showToast({
        type: 'success',
        title: 'Images Added',
        message: `Added ${newItems.length} question ${newItems.length === 1 ? 'image' : 'images'}.`,
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Run Question Detection on Complete Images
  const handleAnalyzeImages = async () => {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setKeyModalOpen(true);
      return;
    }

    if (images.length === 0) {
      showToast({ type: 'warning', title: 'No Images', message: 'Please upload at least one image.' });
      return;
    }

    setCurrentStep('detecting');
    setIsUnclear(false);

    try {
      const allDetected: DetectedQuestion[] = [];
      let foundUnclear = false;

      for (let idx = 0; idx < images.length; idx++) {
        const img = images[idx];
        const res = await detectQuestionsFromImage(img.base64, img.mimeType, selectedSubject, apiKey);

        if (res.isUnclear && res.questions.length === 0) {
          foundUnclear = true;
          setUnclearNote(res.unreadableNote || 'Image was too blurry or cropped to read clearly.');
        } else {
          res.questions.forEach((q, qIdx) => {
            allDetected.push({
              ...q,
              id: `img${idx}_q${qIdx}_${q.id || qIdx}`,
              questionNumber: q.questionNumber || `Question ${allDetected.length + 1}`,
            });
          });
        }
      }

      if (foundUnclear && allDetected.length === 0) {
        setIsUnclear(true);
        setCurrentStep('upload');
        showToast({
          type: 'error',
          title: 'Unclear Image',
          message: 'Some or all questions could not be read clearly. Please upload a clearer photo.',
        });
        return;
      }

      if (allDetected.length === 0) {
        allDetected.push({
          id: 'q1',
          questionNumber: 'Question 1',
          title: 'Detected Question from photo',
          fullText: 'Question extracted from image',
          questionType: 'Short Question',
          parts: [{ partId: '(a)', text: 'Main Question' }],
        });
      }

      setDetectedQuestions(allDetected);
      setSelectedQuestionIds(allDetected.map((q) => q.id));
      setCurrentStep('select-questions');
      showToast({
        type: 'success',
        title: 'Analysis Complete',
        message: `Detected ${allDetected.length} questions across the image(s).`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Analysis Error', message: err?.message || 'Failed to detect questions.' });
      setCurrentStep('upload');
    }
  };

  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestionIds.length === detectedQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(detectedQuestions.map((q) => q.id));
    }
  };

  // Targeted Solving of Selected Questions in Selected Medium
  const handleGenerateFinalNotes = async () => {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setKeyModalOpen(true);
      return;
    }

    const selectedToSolve = detectedQuestions.filter((q) => selectedQuestionIds.includes(q.id));
    if (selectedToSolve.length === 0) {
      showToast({ type: 'warning', title: 'No Selection', message: 'Please select at least one question to solve.' });
      return;
    }

    setCurrentStep('solving');

    try {
      // 1. Solve all selected questions & parts with Medium context
      let solvedList: SolvedQuestionItem[] = await solveSelectedQuestions(
        selectedToSolve,
        selectedMode,
        selectedSubject,
        selectedMedium,
        apiKey
      );

      // 2. Validate Medium Language
      if (selectedMedium === 'Urdu Medium') {
        const firstAnswer = solvedList?.[0]?.parts?.[0]?.answer || '';
        const isValidUrdu = validateMediumLanguage(firstAnswer, 'Urdu Medium');
        if (!isValidUrdu && firstAnswer.length > 5) {
          // Retry once if Urdu was not returned
          solvedList = await solveSelectedQuestions(
            selectedToSolve,
            selectedMode,
            selectedSubject,
            'Urdu Medium',
            apiKey
          );
        }
      }

      // 3. Render high-resolution canvas note image
      const renderedImageUrl = await renderMultiNoteImage({
        subject: selectedSubject,
        medium: selectedMedium,
        questions: solvedList,
        noteType: selectedMode,
      });

      setSolvedNote({
        id: `note-${Date.now()}`,
        subject: selectedSubject,
        medium: selectedMedium,
        selectedQuestions: solvedList,
        noteType: selectedMode,
        renderedImageUrl,
      });

      setCurrentStep('results');
      showToast({ type: 'success', title: 'Notes Ready!', message: `Solved in ${selectedMedium} format.` });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Generation Failed', message: err?.message || 'Failed to generate note.' });
      setCurrentStep('confirm-mode');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (currentStep === 'results') setCurrentStep('select-questions');
                else if (currentStep === 'confirm-mode') setCurrentStep('select-questions');
                else if (currentStep === 'select-questions') setCurrentStep('upload');
                else if (currentStep === 'upload') setCurrentStep('medium');
                else if (currentStep === 'medium') setCurrentStep('subject');
                else router.push('/ai');
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-none">
                  AI Note Generator
                </h1>
                {currentStep !== 'subject' && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
                    {selectedSubject}
                  </span>
                )}
                {currentStep !== 'subject' && currentStep !== 'medium' && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                    {selectedMedium}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                Al Imran Tenses Learner
              </p>
            </div>
          </div>

          <button
            onClick={() => setKeyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 text-xs font-bold transition-all"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">API Key</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* ========================================================================= */}
        {/* STEP 1: SUBJECT SELECTION                                                */}
        {/* ========================================================================= */}
        {currentStep === 'subject' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-3xl mx-auto"
          >
            <div className="text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                Step 1: Choose Subject
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Select Subject for Notes
              </h2>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                Gemini will analyze your question photos according to the selected subject rules and exam criteria.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SUBJECTS.map((sub) => {
                const Icon = sub.icon;
                return (
                  <motion.button
                    key={sub.type}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedSubject(sub.type);
                      setCurrentStep('medium');
                    }}
                    className="bg-white rounded-[2rem] p-6 border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl ${sub.bg} ${sub.color} flex items-center justify-center border ${sub.border} shadow-xs`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        {sub.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {sub.desc}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: STUDY MEDIUM SELECTION (URDU VS ENGLISH MEDIUM)                  */}
        {/* ========================================================================= */}
        {currentStep === 'medium' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            <div className="text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                Step 2: Choose Study Medium
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Select Your Study Language
              </h2>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                Subject: <strong className="text-slate-900">{selectedSubject}</strong>. Choose whether you want the exam notes in Urdu Script or Easy English.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Urdu Medium */}
              <motion.button
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedMedium('Urdu Medium');
                  setCurrentStep('upload');
                }}
                className="bg-white rounded-[2rem] p-6 border-2 border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs font-bold text-lg">
                    اردو
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Proper Urdu Script
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Urdu Medium</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    اردو میڈیم کے امتحانی نوٹس۔ فارمولے اور سائنسی علامات انگریزی میں رہیں گی جبکہ تفصیلی جواب آسان اردو میں ہوگا۔
                  </p>
                </div>
              </motion.button>

              {/* English Medium */}
              <motion.button
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedMedium('English Medium');
                  setCurrentStep('upload');
                }}
                className="bg-white rounded-[2rem] p-6 border-2 border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs font-bold text-base">
                    EN
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Easy English
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">English Medium</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Easy, direct, and concise English suitable for English-Medium board exam preparation.
                  </p>
                </div>
              </motion.button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setCurrentStep('subject')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-all text-xs uppercase tracking-widest"
              >
                Back to Subjects
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: UPLOAD IMAGES                                                    */}
        {/* ========================================================================= */}
        {currentStep === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Context Pill Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Active Setup:</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  {selectedSubject}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  {selectedMedium}
                </span>
              </div>
              <button
                onClick={() => setCurrentStep('medium')}
                className="text-xs text-slate-500 hover:text-blue-600 font-bold underline"
              >
                Change Medium
              </button>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-3.5 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Image Quality Guidelines
                </h3>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Upload a clear and readable picture of the question. Blurry, dark, cropped, or low-quality images may produce incorrect results.
                </p>
              </div>
            </div>

            {isUnclear && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-xs font-medium">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{unclearNote || 'Some questions could not be read clearly. Please upload a clearer image.'}</span>
              </div>
            )}

            {/* Dropzone Container */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/20 rounded-[2.5rem] p-8 sm:p-12 text-center cursor-pointer transition-all space-y-4 group shadow-xs"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />

              <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-md shadow-blue-500/10">
                <Upload className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Upload {selectedSubject} Question Photos
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Tap to browse or drop images. Output will be generated in <strong>{selectedMedium}</strong>.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 bg-slate-100 group-hover:bg-blue-100/60 text-slate-700 group-hover:text-blue-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                <Plus className="w-4 h-4" />
                Select Photos
              </div>
            </div>

            {/* Uploaded Previews */}
            {images.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Uploaded Photos ({images.length})
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add More
                    </button>
                    <button
                      onClick={() => setImages([])}
                      className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden group shadow-xs"
                    >
                      <div className="aspect-4/3 w-full bg-slate-100 overflow-hidden relative">
                        <img
                          src={img.previewUrl}
                          alt={`Uploaded page ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                          Page #{idx + 1}
                        </div>
                      </div>

                      <div className="p-2.5 flex items-center justify-between bg-white border-t border-slate-100">
                        <span className="text-[11px] font-medium text-slate-500 truncate max-w-[100px]">
                          {img.file.name}
                        </span>
                        <button
                          onClick={() => removeImage(img.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <button
                    id="analyze-image-questions-btn"
                    onClick={handleAnalyzeImages}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-98"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Image &amp; Detect Questions</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: DETECTING / SCANNING SPINNER                                     */}
        {/* ========================================================================= */}
        {currentStep === 'detecting' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-xl max-w-lg mx-auto text-center space-y-6 my-12"
          >
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <Sparkles className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Scanning Complete Image...
              </h2>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                Gemini is identifying all individual questions, subparts (a, b, c...), and question types.
              </p>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: SELECT MULTIPLE DETECTED QUESTIONS                               */}
        {/* ========================================================================= */}
        {currentStep === 'select-questions' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-3xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Select Questions ({detectedQuestions.length} Found)
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                  Detected Questions
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Medium: <strong className="text-slate-800">{selectedMedium}</strong>. Selecting a question includes all its parts.
                </p>
              </div>

              <button
                type="button"
                id="select-all-questions-btn"
                onClick={handleSelectAll}
                className="self-start sm:self-center inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                {selectedQuestionIds.length === detectedQuestions.length ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-slate-400" />
                    <span>Select All</span>
                  </>
                )}
              </button>
            </div>

            {/* Questions Checkbox List */}
            <div className="space-y-3">
              {detectedQuestions.map((q) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                return (
                  <motion.div
                    key={q.id}
                    whileHover={{ scale: 1.005 }}
                    onClick={() => toggleQuestionSelection(q.id)}
                    className={`p-5 rounded-3xl border-2 cursor-pointer transition-all space-y-3 ${
                      isSelected
                        ? 'bg-blue-50/50 border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'}`}>
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="text-sm font-black text-slate-900 mr-2">
                            {q.questionNumber}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded">
                            {q.questionType}
                          </span>
                        </div>
                      </div>

                      {q.parts && q.parts.length > 0 && (
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {q.parts.length} {q.parts.length === 1 ? 'Part' : 'Parts'}
                        </span>
                      )}
                    </div>

                    {q.title && (
                      <p className="text-xs font-semibold text-slate-700 pl-9">
                        {q.title}
                      </p>
                    )}

                    {/* Subparts Preview */}
                    {q.parts && q.parts.length > 0 && (
                      <div className="pl-9 space-y-1.5 pt-1 border-t border-slate-100">
                        {q.parts.map((p, pIdx) => (
                          <div key={pIdx} className="text-xs text-slate-600 font-medium flex items-start gap-1.5">
                            <span className="font-bold text-blue-600 shrink-0">{p.partId || `(${pIdx + 1})`}</span>
                            <span>{p.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={() => setCurrentStep('upload')}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition-all text-xs uppercase tracking-widest"
              >
                Back
              </button>
              <button
                id="continue-to-format-btn"
                disabled={selectedQuestionIds.length === 0}
                onClick={() => setCurrentStep('confirm-mode')}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-40 active:scale-98"
              >
                <span>Continue ({selectedQuestionIds.length} Selected)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: CONFIRM FORMAT (SHORT VS LONG)                                   */}
        {/* ========================================================================= */}
        {currentStep === 'confirm-mode' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            <div className="text-center space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Format Confirmation
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                Choose Answer Format
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Target Medium: <strong className="text-emerald-700">{selectedMedium}</strong> • {selectedQuestionIds.length} Questions Selected
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Short Mode */}
              <button
                id="choose-short-answer-mode-btn"
                type="button"
                onClick={() => setSelectedMode('short')}
                className={`p-6 rounded-3xl border-2 text-left transition-all space-y-3 relative ${
                  selectedMode === 'short'
                    ? 'border-blue-600 bg-blue-50/50 shadow-md shadow-blue-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {selectedMode === 'short' && (
                  <div className="absolute top-4 right-4 text-blue-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-md">
                    2-Mark Format
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">Short Question</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Strictly 1.5–2 lines per simple question in {selectedMedium === 'Urdu Medium' ? 'easy Urdu script' : 'easy English'}. Direct and exam-ready.
                  </p>
                </div>
              </button>

              {/* Long Mode */}
              <button
                id="choose-long-answer-mode-btn"
                type="button"
                onClick={() => setSelectedMode('long')}
                className={`p-6 rounded-3xl border-2 text-left transition-all space-y-3 relative ${
                  selectedMode === 'long'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-md shadow-emerald-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {selectedMode === 'long' && (
                  <div className="absolute top-4 right-4 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    6-Mark Format
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">Long Question</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Complete structured answer with Definition, Main points, Formulas, Steps, and Examples.
                  </p>
                </div>
              </button>
            </div>

            {/* Confirmation Box */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-600">
                You selected <strong className="text-slate-900">{selectedQuestionIds.length} questions</strong>.
              </p>
              <p className="text-xs text-slate-500">
                Medium: <span className="font-bold text-emerald-600">{selectedMedium}</span> • Format: <span className="font-bold text-blue-600 uppercase">{selectedMode === 'short' ? 'Short (1.5-2 Lines)' : 'Long (6-Marks)'}</span>
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setCurrentStep('select-questions')}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition-all text-xs uppercase tracking-widest"
              >
                Back
              </button>
              <button
                id="generate-final-notes-btn"
                onClick={handleGenerateFinalNotes}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-98"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Notes</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 7: SOLVING SPINNER                                                  */}
        {/* ========================================================================= */}
        {currentStep === 'solving' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-xl max-w-lg mx-auto text-center space-y-6 my-12"
          >
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <Sparkles className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Solving in {selectedMedium}...
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Subject: {selectedSubject} • Mode: {selectedMode.toUpperCase()}
              </p>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                Gemini is solving all selected questions and every subpart, then rendering your high-resolution note image.
              </p>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 8: RESULTS & HIGH-RES NOTE IMAGE                                   */}
        {/* ========================================================================= */}
        {currentStep === 'results' && solvedNote && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase">
                    All Selected Parts Solved ✅
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase">
                    {solvedNote.medium}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedSubject} Study Note
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Format: {solvedNote.noteType === 'short' ? 'Short (2-Mark)' : 'Long (6-Mark)'} • {solvedNote.selectedQuestions.length} Questions Solved
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep('subject')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all"
                >
                  New Note
                </button>
                <button
                  id="download-final-note-png-btn"
                  onClick={() => downloadDataUrlAsPng(solvedNote.renderedImageUrl!, `Al_Imran_${selectedSubject}_${selectedMedium}_Notes.png`)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Download Note Image
                </button>
              </div>
            </div>

            {/* Rendered Note Preview Container */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm space-y-4">
              <div
                onClick={() => setPreviewModalOpen(true)}
                className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 cursor-pointer group relative shadow-inner flex items-center justify-center p-2"
              >
                <img
                  src={solvedNote.renderedImageUrl}
                  alt="Generated Multi-Question Note"
                  className="w-full h-auto object-contain transition-transform group-hover:scale-[1.01]"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-2 rounded-2xl">
                  <Eye className="w-4 h-4" />
                  Click to View Full Resolution
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setPreviewModalOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  Full Size Preview
                </button>
                <button
                  onClick={() => downloadDataUrlAsPng(solvedNote.renderedImageUrl!, `Al_Imran_${selectedSubject}_${selectedMedium}_Notes.png`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Save PNG
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Full-Screen Note Preview Modal */}
      <AnimatePresence>
        {previewModalOpen && solvedNote && solvedNote.renderedImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setPreviewModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="text-sm font-bold text-slate-900">{selectedSubject} ({selectedMedium}) High-DPI Note Card</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadDataUrlAsPng(solvedNote.renderedImageUrl!, `Al_Imran_${selectedSubject}_${selectedMedium}_Notes.png`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PNG
                  </button>
                  <button
                    onClick={() => setPreviewModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 overflow-y-auto flex-1 bg-slate-100 flex items-center justify-center">
                <img
                  src={solvedNote.renderedImageUrl}
                  alt="High Resolution Note"
                  className="w-full h-auto rounded-xl shadow-md"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        onSuccess={() => setKeyModalOpen(false)}
      />
    </div>
  );
}
