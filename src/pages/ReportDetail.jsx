import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'
import {
  ArrowLeft, FileText, User, Calendar, Activity, AlertTriangle,
  Heart, Thermometer, Droplet, Wind, CheckCircle, XCircle,
  Pill, Clipboard, TrendingUp, Brain, Stethoscope, Info, Printer, MessageSquare,
  Edit3, Save, X, Plus, Trash2, ChevronDown, ChevronUp, Send
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../services/api'

export default function ReportDetail() {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editSection, setEditSection] = useState(null)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showExtractionInfo, setShowExtractionInfo] = useState(false)
  const [togglingPermission, setTogglingPermission] = useState(false)
  const lastSymptomInputRef = useRef(null)
  const chatEndRef = useRef(null)
  const [aiChatHistory, setAiChatHistory] = useState([])
  const [aiQuestion, setAiQuestion] = useState('')
  const [isAskingAI, setIsAskingAI] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    fetchReport()
    fetchAIChatHistory()
  }, [reportId])

  useEffect(() => {
    if (activeTab === 'ai-chat') {
      scrollToBottom()
    }
  }, [aiChatHistory, activeTab])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchAIChatHistory = async () => {
    try {
      setLoadingHistory(true)
      const response = await api.get(`/medical-reports/${reportId}/ai-chat`)
      if (response.data.success) {
        setAiChatHistory(response.data.history)
      }
    } catch (error) {
      console.error('Error fetching AI chat history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSendAIQuestion = async (e) => {
    if (e) e.preventDefault()
    if (!aiQuestion.trim() || isAskingAI) return

    const questionText = aiQuestion.trim()
    setAiQuestion('')
    
    // Optimistic update
    const tempUserMsg = { id: Date.now(), role: 'user', content: questionText, timestamp: new Date().toISOString() }
    setAiChatHistory(prev => [...prev, tempUserMsg])
    
    try {
      setIsAskingAI(true)
      const response = await api.post(`/medical-reports/${reportId}/ask`, { question: questionText })
      
      if (response.data.success) {
        // Replace temp message with real one and add AI response
        setAiChatHistory(prev => {
          const filtered = prev.filter(m => m.id !== tempUserMsg.id)
          return [...filtered, response.data.question, response.data.answer]
        })
      } else {
        toast.error(response.data.message || 'Failed to get AI answer')
      }
    } catch (error) {
      console.error('Error asking AI:', error)
      toast.error('Failed to communicate with AI')
    } finally {
      setIsAskingAI(false)
    }
  }

  const fetchReport = async () => {
    try {
      const response = await api.get(`/medical-reports/${reportId}`)
      setReport(response.data.report)
    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDoctorPermission = async () => {
    const newValue = !report.doctor_edit_permission
    try {
      setTogglingPermission(true)
      const response = await api.put(`/medical-reports/${reportId}/doctor-edit-permission`, { allow: newValue })
      if (response.data.success) {
        setReport(response.data.report)
        toast.success(newValue ? 'Doctor can now edit this report' : 'Doctor edit access revoked')
      }
    } catch (error) {
      toast.error('Failed to update permission')
    } finally {
      setTogglingPermission(false)
    }
  }

  const triggerAIAnalysis = async () => {    try {
      setAnalyzing(true)
      toast.loading('Analyzing report with AI...', { id: 'ai-analysis' })

      const response = await api.post(`/medical-reports/${reportId}/analyze`)

      if (response.data.success) {
        setReport(response.data.report)
        setAnalysisResults(response.data.report.ai_analysis)
        toast.success('AI analysis completed successfully!', { id: 'ai-analysis' })

        setTimeout(() => {
          setShowAnalysisModal(true)
        }, 500)
      } else {
        toast.error(response.data.message || 'Analysis failed', { id: 'ai-analysis' })
      }
    } catch (error) {
      console.error('Error analyzing report:', error)
      toast.error('Failed to analyze report', { id: 'ai-analysis' })
    } finally {
      setAnalyzing(false)
    }
  }

  const getSeverityColor = (severity) => {
    const colors = {
      LOW: 'bg-green-100 text-green-800 border-green-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
      CRITICAL: 'bg-red-100 text-red-800 border-red-300'
    }
    return colors[severity] || colors.LOW
  }

  const getSeverityIcon = (severity) => {
    if (severity === 'CRITICAL') return '🔴'
    if (severity === 'HIGH') return '🟠'
    if (severity === 'MEDIUM') return '🟡'
    return '🟢'
  }

  const handleExportPDF = () => {
    setIsPrinting(true)

    setTimeout(() => {
      window.print()
      setTimeout(() => {
        setIsPrinting(false)
      }, 100)
    }, 100)
  }

  const handleDeleteReport = async () => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return
    }

    try {
      toast.loading('Deleting report...', { id: 'delete-report-detail' })
      const response = await api.delete(`/medical-reports/${reportId}`)

      if (response.data.success) {
        toast.success('Report deleted successfully', { id: 'delete-report-detail' })
        navigate(-1)
      } else {
        toast.error('Failed to delete report', { id: 'delete-report-detail' })
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      toast.error('Failed to delete report', { id: 'delete-report-detail' })
    }
  }

  const startEdit = (section) => {
    setEditSection(section)
    setEditMode(true)

    const aiAnalysis = report?.ai_analysis || {}

    switch (section) {
      case 'patient_info':
        setEditData(aiAnalysis.patient_info || {})
        break
      case 'diagnoses':
        setEditData({ diagnoses: aiAnalysis.diagnoses || [] })
        break
      case 'symptoms':
        setEditData({ symptoms: aiAnalysis.symptoms || [] })
        break
      case 'medications':
        setEditData({ current_medications: aiAnalysis.current_medications || [] })
        break
      case 'vital_signs':
        setEditData(aiAnalysis.vital_signs || {})
        break
      case 'lab_results':
        setEditData({ lab_results: aiAnalysis.lab_results || [] })
        break
      default:
        setEditData({})
    }
  }

  const cancelEdit = () => {
    setEditMode(false)
    setEditSection(null)
    setEditData({})
  }

  const saveEdit = async () => {
    try {
      setSaving(true)

      const currentAnalysis = { ...report.ai_analysis }

      switch (editSection) {
        case 'patient_info':
          currentAnalysis.patient_info = editData
          break
        case 'diagnoses':
          currentAnalysis.diagnoses = (editData.diagnoses || []).filter(diagnosis => diagnosis.trim() !== '')
          break
        case 'symptoms':
          currentAnalysis.symptoms = (editData.symptoms || []).filter(symptom => symptom.trim() !== '')
          break
        case 'medications':
          currentAnalysis.current_medications = editData.current_medications
          break
        case 'vital_signs':
          currentAnalysis.vital_signs = editData
          break
        case 'lab_results':
          currentAnalysis.lab_results = editData.lab_results
          break
      }

      const response = await api.put(`/medical-reports/${reportId}/ai-analysis`, {
        ai_analysis: currentAnalysis
      })

      if (response.data.success) {
        setReport(response.data.report)
        toast.success('Analysis updated successfully!')
        cancelEdit()
      } else {
        toast.error(response.data.message || 'Failed to update analysis')
      }
    } catch (error) {
      console.error('Error saving edit:', error)
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const addArrayItem = (field, newItem) => {
    setEditData(prev => {
      const currentArray = prev[field] || []
      const newArray = [...currentArray, newItem]

      if (field === 'symptoms') {
        setTimeout(() => {
          if (lastSymptomInputRef.current) {
            lastSymptomInputRef.current.focus()
            lastSymptomInputRef.current.select()
          }
        }, 100)
      }

      return {
        ...prev,
        [field]: newArray
      }
    })

    if (field === 'symptoms') {
      toast.success('New symptom field added! Start typing to enter the symptom.')
    } else if (field === 'diagnoses') {
      toast.success('New diagnosis field added!')
    }
  }

  const removeArrayItem = (field, index) => {
    setEditData(prev => {
      const currentArray = prev[field] || []
      return {
        ...prev,
        [field]: currentArray.filter((_, i) => i !== index)
      }
    })
  }

  const updateArrayItem = (field, index, value) => {
    setEditData(prev => {
      const currentArray = prev[field] || []
      const newArray = [...currentArray]
      newArray[index] = value
      return {
        ...prev,
        [field]: newArray
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center card p-12">
          <AlertTriangle className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600 mb-6">The requested medical report could not be found.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const aiAnalysis = report?.ai_analysis || {}
  const patientInfo = aiAnalysis.patient_info || {}
  const vitalSigns = aiAnalysis.vital_signs || {}

  // Try to parse stringified JSON or Python-style dictionaries
  const smartParse = (val) => {
    if (typeof val !== 'string' || val === '') return val;
    const trimmed = val.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return val;

    try {
      return JSON.parse(trimmed);
    } catch (e) {
      try {
        // Handle Python-style dict strings: {'key': 'value'}
        // This is a naive replacement but usually sufficient for AI output
        const jsonLike = trimmed
          .replace(/'/g, '"')
          .replace(/None/g, 'null')
          .replace(/True/g, 'true')
          .replace(/False/g, 'false');
        return JSON.parse(jsonLike);
      } catch (e2) {
        return val;
      }
    }
  };

  // Safely convert any value to a renderable string — prevents "Objects are not valid as React child"
  const safeStr = (val) => {
    if (val === null || val === undefined) return ''
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch (e) {
        return String(val);
      }
    }
    return String(val)
  }

  const normalizeLabResults = (list) =>
    (Array.isArray(list) ? list : []).map(lab => {
      const unit = smartParse(lab?.unit || lab?.units);
      const reference_range = smartParse(lab?.reference_range || lab?.bio_ref_interval || lab?.ref_range);
      const valueParsed = smartParse(lab?.value ?? lab?.result);

      const formatDisplayValue = (v) => {
        if (typeof v === 'object' && v !== null) {
          return Object.entries(v)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        }
        return safeStr(v);
      };

      return {
        test_name: safeStr(lab?.test_name || lab?.name),
        value: formatDisplayValue(valueParsed),
        unit: formatDisplayValue(unit),
        reference_range: formatDisplayValue(reference_range),
        is_abnormal: Boolean(lab?.is_abnormal || lab?.abnormal || false),
        abnormality_type: safeStr(lab?.abnormality_type || lab?.interpretation || lab?.flag),
        _original_value: valueParsed,
        _original_unit: unit,
        _original_reference: reference_range
      };
    })

  const normalizeMedications = (list) =>
    (Array.isArray(list) ? list : []).map(med => ({
      name: safeStr(med?.name || med?.drug_name || med?.medication),
      dosage: safeStr(med?.dosage || med?.dose),
      frequency: safeStr(med?.frequency || med?.freq),
      duration: safeStr(med?.duration),
      route: safeStr(med?.route),
      instructions: safeStr(med?.instructions || med?.notes),
    }))

  // Normalize lab results — guard against objects being passed as React children
  const labResults = normalizeLabResults(aiAnalysis.lab_results)
  const diagnoses = [...new Set(Array.isArray(aiAnalysis.diagnoses) ? aiAnalysis.diagnoses.map(safeStr) : [])]
  const symptoms = [...new Set(Array.isArray(aiAnalysis.symptoms) ? aiAnalysis.symptoms.map(safeStr) : [])]
  const medications = normalizeMedications(aiAnalysis.current_medications)
  const abnormalFindings = (Array.isArray(aiAnalysis.abnormal_findings) ? aiAnalysis.abnormal_findings : []).map(smartParse)
  const clinicalSuggestions = (Array.isArray(aiAnalysis.clinical_suggestions) ? aiAnalysis.clinical_suggestions : []).map(s =>
    typeof s === 'object' && s !== null ? {
      category: safeStr(s.category),
      suggestion: safeStr(s.suggestion || s.text),
      confidence: parseFloat(s.confidence) || 0,
      priority: safeStr(s.priority),
      reasoning: safeStr(s.reasoning),
    } : { category: '', suggestion: safeStr(s), confidence: 0, priority: '', reasoning: '' }
  )
  const medicalHistory = (Array.isArray(aiAnalysis.medical_history) ? aiAnalysis.medical_history : []).map(safeStr)
  const icd10Codes = (Array.isArray(aiAnalysis.icd10_codes) ? aiAnalysis.icd10_codes : []).map(safeStr)

  const calculateDataCompleteness = () => {
    const sections = {
      patientInfo: {
        weight: 20,
        fields: ['name', 'age', 'gender', 'blood_group', 'contact'],
        data: patientInfo,
        count: Object.values(patientInfo).filter(v => v !== null && v !== undefined && v !== '').length
      },
      vitalSigns: {
        weight: 15,
        fields: ['blood_pressure', 'heart_rate', 'temperature', 'oxygen_saturation'],
        data: vitalSigns,
        count: Object.values(vitalSigns).filter(v => v !== null && v !== undefined && v !== '').length
      },
      diagnoses: {
        weight: 25,
        fields: ['diagnoses'],
        data: { diagnoses },
        count: diagnoses.length > 0 ? 1 : 0
      },
      symptoms: {
        weight: 20,
        fields: ['symptoms'],
        data: { symptoms },
        count: symptoms.length > 0 ? 1 : 0
      },
      medications: {
        weight: 10,
        fields: ['medications'],
        data: { medications },
        count: medications.length > 0 ? 1 : 0
      },
      labResults: {
        weight: 10,
        fields: ['lab_results'],
        data: { lab_results: labResults },
        count: labResults.length > 0 ? 1 : 0
      }
    }

    let totalScore = 0
    let maxScore = 0
    const sectionScores = {}

    Object.entries(sections).forEach(([key, section]) => {
      const sectionScore = (section.count / section.fields.length) * section.weight
      const sectionMax = section.weight

      totalScore += sectionScore
      maxScore += sectionMax

      sectionScores[key] = {
        score: sectionScore,
        max: sectionMax,
        percentage: Math.round((sectionScore / sectionMax) * 100),
        completeness: section.count,
        total: section.fields.length
      }
    })

    const overallPercentage = Math.round((totalScore / maxScore) * 100)

    return {
      overall: overallPercentage,
      sections: sectionScores,
      quality: overallPercentage >= 80 ? 'excellent' :
        overallPercentage >= 60 ? 'good' :
          overallPercentage >= 40 ? 'fair' : 'poor'
    }
  }

  const dataCompleteness = calculateDataCompleteness()

  const getSectionStatus = (sectionData, minItems = 1) => {
    if (Array.isArray(sectionData)) {
      const validItems = sectionData.filter(item =>
        item && (typeof item === 'string' ? item.trim() !== '' : true)
      );
      return {
        status: validItems.length >= minItems ? 'complete' : validItems.length > 0 ? 'partial' : 'incomplete',
        count: validItems.length,
        quality: validItems.length >= minItems ? 'high' : validItems.length > 0 ? 'medium' : 'low'
      };
    } else if (typeof sectionData === 'object' && sectionData !== null) {
      const filledFields = Object.entries(sectionData).filter(([key, value]) =>
        value !== null && value !== undefined && value !== '' &&
        !(Array.isArray(value) && value.length === 0)
      );
      const totalFields = Object.keys(sectionData).length;
      const completionRate = totalFields > 0 ? filledFields.length / totalFields : 0;

      return {
        status: completionRate >= 0.7 ? 'complete' : completionRate > 0.3 ? 'partial' : 'incomplete',
        count: filledFields.length,
        total: totalFields,
        quality: completionRate >= 0.8 ? 'high' : completionRate >= 0.5 ? 'medium' : 'low'
      };
    }
    return { status: 'incomplete', count: 0, quality: 'low' };
  }

  const getStatusColor = (statusInfo) => {
    if (typeof statusInfo === 'string') {
      switch (statusInfo) {
        case 'complete': return 'text-green-600 bg-green-100 border-green-300'
        case 'incomplete': return 'text-yellow-600 bg-yellow-100 border-yellow-300'
        case 'missing': return 'text-red-600 bg-red-100 border-red-300'
        default: return 'text-gray-600 bg-gray-100 border-gray-300'
      }
    }

    const { status, quality } = statusInfo;
    if (status === 'complete') {
      return quality === 'high' ? 'text-green-700 bg-green-100 border-green-400' : 'text-green-600 bg-green-50 border-green-300';
    } else if (status === 'partial') {
      return quality === 'medium' ? 'text-yellow-700 bg-yellow-100 border-yellow-400' : 'text-yellow-600 bg-yellow-50 border-yellow-300';
    } else {
      return 'text-red-600 bg-red-100 border-red-300';
    }
  }

  const getStatusIcon = (statusInfo) => {
    if (typeof statusInfo === 'string') {
      switch (statusInfo) {
        case 'complete': return ''
        case 'partial': return '⚠️'
        case 'incomplete': return '❌'
        default: return '❓'
      }
    }

    const { status, quality } = statusInfo;
    if (status === 'complete') {
      return quality === 'high' ? '🎯' : '✅';
    } else if (status === 'partial') {
      return '⚠️';
    } else {
      return '❌';
    }
  }

  const shouldShowSection = (sectionData, sectionType = 'array') => {
    if (sectionType === 'array') {
      return Array.isArray(sectionData) && sectionData.length > 0;
    } else if (sectionType === 'object') {
      return sectionData && typeof sectionData === 'object' &&
        Object.values(sectionData).some(value =>
          value !== null && value !== undefined && value !== '' &&
          !(Array.isArray(value) && value.length === 0)
        );
    }
    return false;
  };

  const validateFieldAccuracy = (fieldName, value, fieldType = 'text') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { isValid: false, confidence: 0, message: 'No data extracted', color: 'red' };
    }

    switch (fieldType) {
      case 'name':
        const namePattern = /^[A-Za-z\s]{2,50}$/;
        const isValidName = namePattern.test(value) && !value.toLowerCase().includes('patient');
        return {
          isValid: isValidName,
          confidence: isValidName ? 0.9 : 0.3,
          message: isValidName ? 'Valid name format' : 'Name may need verification',
          color: isValidName ? 'green' : 'yellow'
        };

      case 'age':
        const age = parseInt(value);
        const isValidAge = age > 0 && age < 120;
        return {
          isValid: isValidAge,
          confidence: isValidAge ? 0.95 : 0.2,
          message: isValidAge ? 'Valid age range' : 'Age seems incorrect',
          color: isValidAge ? 'green' : 'red'
        };

      case 'blood_pressure':
        const bpPattern = /^\d{2,3}\/\d{2,3}$/;
        const isValidBP = bpPattern.test(value);
        if (isValidBP) {
          const [systolic, diastolic] = value.split('/').map(Number);
          const isReasonable = systolic >= 70 && systolic <= 250 && diastolic >= 40 && diastolic <= 150;
          return {
            isValid: isReasonable,
            confidence: isReasonable ? 0.9 : 0.6,
            message: isReasonable ? 'Valid BP reading' : 'BP values may need verification',
            color: isReasonable ? 'green' : 'yellow'
          };
        }
        return { isValid: false, confidence: 0.3, message: 'Invalid BP format', color: 'red' };

      case 'diagnosis':
        const hasValidMedicalTerms = /\b(diabetes|hypertension|infection|syndrome|disease|disorder|condition)\b/i.test(value);
        const isNotGeneric = !/(diagnosis|condition|patient|report)/i.test(value);
        const isValid = hasValidMedicalTerms && isNotGeneric && value.length > 5;
        return {
          isValid: isValid,
          confidence: isValid ? 0.8 : 0.4,
          message: isValid ? 'Valid medical diagnosis' : 'Diagnosis may need review',
          color: isValid ? 'green' : 'yellow'
        };

      case 'medication':
        const commonMeds = /\b(metformin|lisinopril|aspirin|insulin|atorvastatin|amlodipine|omeprazole|levothyroxine)\b/i;
        const hasValidMedName = commonMeds.test(value) || /\b\w+(cillin|statin|pril|sartan|olol|pine|zide)\b/i.test(value);
        return {
          isValid: hasValidMedName,
          confidence: hasValidMedName ? 0.85 : 0.5,
          message: hasValidMedName ? 'Recognized medication' : 'Medication name may need verification',
          color: hasValidMedName ? 'green' : 'yellow'
        };

      default:
        const hasContent = value && value.toString().trim().length > 2;
        return {
          isValid: hasContent,
          confidence: hasContent ? 0.7 : 0.1,
          message: hasContent ? 'Data extracted' : 'No valid data',
          color: hasContent ? 'blue' : 'red'
        };
    }
  };

  const ValidationIndicator = ({ fieldName, value, fieldType, className = "" }) => {
    const validation = validateFieldAccuracy(fieldName, value, fieldType);
    const colors = {
      green: 'bg-green-100 text-green-800 border-green-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      blue: 'bg-primary-100 text-primary-800 border-blue-300',
      red: 'bg-red-100 text-red-800 border-red-300'
    };

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors[validation.color]} ${className}`}>
        <span className="text-xs">
          {validation.color === 'green' ? '✅' :
            validation.color === 'yellow' ? '⚠️' :
              validation.color === 'blue' ? 'ℹ️' : '❌'}
        </span>
        <span>{Math.round(validation.confidence * 100)}%</span>
      </div>
    );
  };

  const isDoctor = userProfile?.role === 'DOCTOR'
  const isPatient = userProfile?.role === 'PATIENT'
  const canEdit = isPatient || (isDoctor && report?.doctor_edit_permission === true)

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10 font-sans print:bg-white print:py-0">
      {/* Print Header */}
      <div className="hidden print:block print-header mb-4">
        <h1 className="text-xl font-bold">Medical Report Analysis</h1>
        <p className="text-xs text-gray-500 mt-0.5">Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        {aiAnalysis.analyzed_by && <p className="text-xs text-gray-400 mt-0.5">Analyzed by: {aiAnalysis.analyzed_by}</p>}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 print:px-0">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* ── Report Header Card ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-4 print:border-gray-300">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

            {/* Left: icon + title */}
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">Medical Report Analysis</h1>
                <p className="text-sm text-gray-500 truncate">{report.file_name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(report.uploaded_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {report.file_type?.toUpperCase()}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${report.status === 'ANALYZED' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' :
                      report.status === 'REVIEWING' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' :
                        'bg-gray-100 text-gray-600'
                    }`}>{report.status}</span>
                </div>
              </div>
            </div>

            {/* Right: badges + actions */}
            <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {aiAnalysis.severity_level && (
                  <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${getSeverityColor(aiAnalysis.severity_level)}`}>
                    <span>{getSeverityIcon(aiAnalysis.severity_level)}</span>
                    {aiAnalysis.severity_level}
                  </span>
                )}
                {Object.keys(aiAnalysis).length > 0 && (
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${dataCompleteness.quality === 'excellent' ? 'bg-green-50 text-green-700' :
                      dataCompleteness.quality === 'good' ? 'bg-blue-50 text-blue-700' :
                        dataCompleteness.quality === 'fair' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                    }`}>{dataCompleteness.overall}% complete</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap print:hidden">
                {/* Patient / Admin only: delete */}
                {!isDoctor && (userProfile?.uid === report?.patient_id || userProfile?.role === 'ADMIN') && (
                  <button
                    onClick={handleDeleteReport}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
                {/* Chat — both roles when doctor assigned */}
                {report.assigned_doctor_id && (
                  <button
                    onClick={() => navigate(`/chat/${reportId}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-violet-500 hover:bg-violet-600 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat
                  </button>
                )}
                {/* AI Analyze — patient/admin only */}
                {!isDoctor && (
                  <button
                    onClick={triggerAIAnalysis}
                    disabled={analyzing}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${analyzing ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                        !aiAnalysis || Object.keys(aiAnalysis).length === 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      }`}
                  >
                    {analyzing ? (
                      <><div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />Analyzing...</>
                    ) : (
                      <><Brain className="w-3.5 h-3.5" />{!aiAnalysis || Object.keys(aiAnalysis).length === 0 ? 'Analyze with AI' : 'Re-analyze'}</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className={`card p-4 border-l-4 border-blue-500 transition-all hover:shadow-md ${getSectionStatus(diagnoses).status === 'complete' ? 'ring-2 ring-blue-200' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-gray-600 font-medium">Diagnoses</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(getSectionStatus(diagnoses))}`}>
                    {getStatusIcon(getSectionStatus(diagnoses))} {getSectionStatus(diagnoses).status}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">{diagnoses.length}</p>
                  <span className="text-xs text-gray-500">
                    {getSectionStatus(diagnoses).quality === 'high' ? 'High Quality' :
                      getSectionStatus(diagnoses).quality === 'medium' ? 'Medium Quality' : 'Needs Review'}
                  </span>
                </div>
                {diagnoses.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1 truncate">Latest: {diagnoses[0]}</p>
                )}
              </div>
              <Clipboard className="w-8 h-8 text-primary-500 opacity-50" />
            </div>
          </div>

          <div className={`card p-4 border-l-4 border-green-500 transition-all hover:shadow-md ${getSectionStatus(labResults).status === 'complete' ? 'ring-2 ring-green-200' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-gray-600 font-medium">Lab Tests</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(getSectionStatus(labResults))}`}>
                    {getStatusIcon(getSectionStatus(labResults))} {getSectionStatus(labResults).status}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">{labResults.length}</p>
                  <span className="text-xs text-gray-500">
                    {labResults.filter(l => l.is_abnormal).length > 0 ?
                      `${labResults.filter(l => l.is_abnormal).length} abnormal` : 'All normal'}
                  </span>
                </div>
                {labResults.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1 truncate">Latest: {labResults[0].test_name}</p>
                )}
              </div>
              <Activity className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>

          <div className={`card p-4 border-l-4 border-red-500 transition-all hover:shadow-md ${getSectionStatus(abnormalFindings).status === 'complete' ? 'ring-2 ring-red-200' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-gray-600 font-medium">Abnormal Findings</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${abnormalFindings.length > 0 ? 'text-red-700 bg-red-100 border-red-300' : 'text-green-700 bg-green-100 border-green-300'
                    }`}>
                    {abnormalFindings.length > 0 ? '⚠️ found' : '✅ none'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">{abnormalFindings.length}</p>
                  <span className="text-xs text-gray-500">
                    {abnormalFindings.length > 0 ? 'Critical findings' : 'Normal range'}
                  </span>
                </div>
                {abnormalFindings.length > 0 && (
                  <p className="text-xs text-red-600 mt-1 font-medium">Requires attention</p>
                )}
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </div>

          <div className={`card p-4 border-l-4 border-purple-500 transition-all hover:shadow-md ${getSectionStatus(clinicalSuggestions).status === 'complete' ? 'ring-2 ring-purple-200' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-gray-600 font-medium">AI Insights</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(getSectionStatus(clinicalSuggestions))}`}>
                    {getStatusIcon(getSectionStatus(clinicalSuggestions))} {getSectionStatus(clinicalSuggestions).status}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">{clinicalSuggestions.length}</p>
                  <span className="text-xs text-gray-500">
                    {clinicalSuggestions.filter(s => s.priority === 'CRITICAL' || s.priority === 'HIGH').length > 0 ?
                      `${clinicalSuggestions.filter(s => s.priority === 'CRITICAL' || s.priority === 'HIGH').length} high priority` :
                      'Standard priority'}
                  </span>
                </div>
                {clinicalSuggestions.length > 0 && (
                  <p className="text-xs text-purple-600 mt-1 font-medium">
                    AI confidence: {Math.round(clinicalSuggestions.reduce((acc, s) => acc + s.confidence, 0) / clinicalSuggestions.length * 100)}%
                  </p>
                )}
              </div>
              <Brain className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
        </div> */}

        {/* ── Doctor read-only banner ── */}
        {isDoctor && (
          <div className={`mb-4 rounded-xl border px-4 py-3 flex items-center gap-3 print:hidden ${report.doctor_edit_permission ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            {report.doctor_edit_permission ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-800 font-medium">Patient has granted you edit access for this report.</p>
              </>
            ) : (
              <>
                <Info className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800 font-medium">This report is read-only. The patient has not granted edit access. Ask the patient to enable it via chat.</p>
              </>
            )}
          </div>
        )}

        {/* ── Patient: doctor edit permission toggle ── */}
        {isPatient && report.assigned_doctor_id && (
          <div className={`mb-4 rounded-xl border px-4 py-3 flex items-center justify-between gap-3 print:hidden ${report.doctor_edit_permission ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <Edit3 className={`w-4 h-4 shrink-0 ${report.doctor_edit_permission ? 'text-green-600' : 'text-gray-500'}`} />
              <div>
                <p className="text-sm font-medium text-gray-800">Doctor edit access</p>
                <p className="text-xs text-gray-500">{report.doctor_edit_permission ? 'Your doctor can edit this report' : 'Your doctor can only view this report'}</p>
              </div>
            </div>
            <button
              onClick={handleToggleDoctorPermission}
              disabled={togglingPermission}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${report.doctor_edit_permission ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${report.doctor_edit_permission ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        )}

        {/* ── Tab Navigation ── */}
        <div className="flex items-center gap-1 mb-4 bg-white rounded-lg border border-gray-200 shadow-sm p-1 overflow-x-auto scrollbar-hide print:hidden">
          {[
            { id: 'overview', label: 'Overview', icon: Clipboard },
            { id: 'vitals', label: 'Vitals', icon: Heart },
            { id: 'labs', label: 'Labs', icon: Activity },
            { id: 'medications', label: 'Medications', icon: Pill },
            { id: 'suggestions', label: 'AI Insights', icon: Brain },
            { id: 'ai-chat', label: 'Ask AI', icon: MessageSquare }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── AI Info Toggles (compact inline bar) ── */}
        <div className="space-y-3 mb-4">
          {Object.keys(aiAnalysis).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Compact toggle bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 flex-wrap">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mr-1">Details</span>

                {/* Data Extraction Summary toggle */}
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${showSummary
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  Extraction Summary
                  <span className={`ml-0.5 ${dataCompleteness.quality === 'excellent' ? 'text-green-600' :
                      dataCompleteness.quality === 'good' ? 'text-blue-600' :
                        dataCompleteness.quality === 'fair' ? 'text-amber-600' : 'text-red-600'
                    } font-semibold`}>{dataCompleteness.overall}%</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showSummary ? 'rotate-180' : ''}`} />
                </button>

                {/* Data Extraction Analysis toggle */}
                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${showAnalysis
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                    }`}
                >
                  <Brain className="w-3 h-3" />
                  Analysis
                  <ChevronDown className={`w-3 h-3 transition-transform ${showAnalysis ? 'rotate-180' : ''}`} />
                </button>

                {/* Extraction Info toggle */}
                {report.ai_analysis?.extraction_info && (
                  <button
                    onClick={() => setShowExtractionInfo(!showExtractionInfo)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${showExtractionInfo
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                      }`}
                  >
                    <Activity className="w-3 h-3" />
                    OCR Info
                    <ChevronDown className={`w-3 h-3 transition-transform ${showExtractionInfo ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {/* Data Extraction Summary panel */}
              {showSummary && (
                <div className="px-4 py-3 border-b border-gray-100 animate-fadeIn">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-blue-800">Patient Info</span>
                        <span className="text-xs font-bold text-blue-700">{dataCompleteness.sections.patientInfo.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-blue-100 rounded-full">
                        <div className="h-1.5 bg-blue-400 rounded-full transition-all" style={{ width: `${dataCompleteness.sections.patientInfo.percentage}%` }} />
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {['name', 'age', 'gender'].map(f => (
                          <span key={f} className={`text-[10px] px-1.5 py-0.5 rounded ${patientInfo[f] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                            }`}>{f}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-rose-800">Vital Signs</span>
                        <span className="text-xs font-bold text-rose-700">{dataCompleteness.sections.vitalSigns.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-rose-100 rounded-full">
                        <div className="h-1.5 bg-rose-400 rounded-full transition-all" style={{ width: `${dataCompleteness.sections.vitalSigns.percentage}%` }} />
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {['bp', 'heart_rate', 'temp'].map(f => (
                          <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">{f}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-emerald-800">Clinical Data</span>
                        <span className="text-xs font-bold text-emerald-700">
                          {Math.round(((diagnoses.length > 0 ? 1 : 0) + (symptoms.length > 0 ? 1 : 0) + (medications.length > 0 ? 1 : 0)) / 3 * 100)}%
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${diagnoses.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                          }`}>Diagnoses {diagnoses.length}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${symptoms.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                          }`}>Symptoms {symptoms.length}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${medications.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                          }`}>Meds {medications.length}</span>
                      </div>
                    </div>
                  </div>
                  {dataCompleteness.overall < 60 && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Consider re-uploading with better image quality for improved extraction.
                    </p>
                  )}
                </div>
              )}

              {/* Data Extraction Analysis panel */}
              {showAnalysis && (
                <div className="px-4 py-3 border-b border-gray-100 animate-fadeIn">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {Object.entries(dataCompleteness.sections).map(([key, data]) => {
                      const names = { patientInfo: 'Patient', vitalSigns: 'Vitals', diagnoses: 'Diagnoses', symptoms: 'Symptoms', medications: 'Meds', labResults: 'Labs' }
                      const color = data.percentage >= 80 ? 'bg-green-400' : data.percentage >= 50 ? 'bg-amber-400' : data.percentage > 0 ? 'bg-orange-400' : 'bg-red-400'
                      return (
                        <div key={key} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] font-medium text-gray-600">{names[key]}</span>
                            <span className="text-[11px] font-bold text-gray-800">{data.percentage}%</span>
                          </div>
                          <div className="w-full h-1 bg-gray-200 rounded-full">
                            <div className={`h-1 rounded-full ${color}`} style={{ width: `${data.percentage}%` }} />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">{data.completeness}/{data.total} fields</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Extraction Info panel */}
              {showExtractionInfo && report.ai_analysis?.extraction_info && (
                <div className="px-4 py-3 animate-fadeIn">
                  {report.ai_analysis.extraction_info.ocr_quality_warning && (
                    <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-700 mb-2 border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>OCR quality issue detected — results may be incomplete.
                        {report.ai_analysis.extraction_info.ocr_quality_issues?.length > 0 && (
                          <span className="block mt-0.5 text-amber-600">{report.ai_analysis.extraction_info.ocr_quality_issues.join(', ')}</span>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                      📄 {report.ai_analysis.extraction_info.file_type?.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                      {report.ai_analysis.extraction_info.text_length?.toLocaleString()} chars
                    </span>
                    <span className={`px-2 py-1 rounded ${report.ai_analysis.extraction_info.extraction_successful ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      }`}>
                      {report.ai_analysis.extraction_info.extraction_successful ? '✅ Extracted' : '❌ Failed'}
                    </span>
                    {report.ai_analysis.extraction_info.ocr_quality_score != null && (
                      <span className={`px-2 py-1 rounded font-medium ${report.ai_analysis.extraction_info.ocr_quality_score >= 0.8 ? 'bg-green-50 text-green-700' :
                          report.ai_analysis.extraction_info.ocr_quality_score >= 0.5 ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-600'
                        }`}>OCR {Math.round(report.ai_analysis.extraction_info.ocr_quality_score * 100)}%</span>
                    )}
                  </div>
                  {report.ai_analysis.extraction_info.extracted_text_preview && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 select-none">View text preview</summary>
                      <pre className="mt-1 p-2 bg-gray-50 border border-gray-200 rounded text-[10px] overflow-x-auto leading-relaxed">
                        {report.ai_analysis.extraction_info.extracted_text_preview}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {(!aiAnalysis || Object.keys(aiAnalysis).length === 0) && !isDoctor && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-6 shadow-lg print:hidden">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-200 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-red-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-900 mb-2">⚠️ No AI Analysis Available</h3>
                  <p className="text-red-800 mb-4">
                    This report has not been analyzed by our AI system yet. Click the "Analyze with AI" button above to extract medical information,
                    identify diagnoses, analyze lab results, and get clinical decision support recommendations.
                  </p>
                  <button
                    onClick={triggerAIAnalysis}
                    disabled={analyzing}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-base transition-all ${analyzing
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                      }`}
                  >
                    {analyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Analyzing Report...
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5" />
                        Analyze This Report Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          { }
          {report.ai_analysis?.extraction_info && (
            <>
              {report.ai_analysis.extraction_info.ocr_quality_warning && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-800 mb-1">Text Extraction Quality Warning</p>
                      <p className="text-xs text-amber-700 mb-2">
                        The AI could not fully read this document (quality score:{' '}
                        {Math.round((report.ai_analysis.extraction_info.ocr_quality_score ?? 0) * 100)}%).
                        Analysis results may be incomplete or inaccurate.
                      </p>
                      {report.ai_analysis.extraction_info.ocr_quality_issues?.length > 0 && (
                        <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5 mb-2">
                          {report.ai_analysis.extraction_info.ocr_quality_issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      )}
                      <p className="text-xs text-amber-600 font-medium">
                        Tip: Re-upload a clearer, higher-resolution scan for best results.
                      </p>
                    </div>
                  </div>
                </div>
              )}


            </>
          )}

          { }
          {(activeTab === 'overview' || isPrinting) && (
            <>
              { }
              {isPrinting && (
                <div className="hidden print:block mb-4 pb-2 border-b-2 border-gray-300">
                  <h2 className="text-xl font-bold">Overview & Patient Information</h2>
                </div>
              )}

              { }
              {!patientInfo?.name && !patientInfo?.age && diagnoses.length === 0 && symptoms.length === 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-yellow-900 mb-2">Limited Data Extraction</h3>
                      <p className="text-sm text-yellow-800 mb-3">
                        The AI was unable to extract much information from this report. This could be due to:
                      </p>
                      <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                        <li>The report format is not standard or uses unusual formatting</li>
                        <li>The image quality is poor (for scanned documents)</li>
                        <li>The document contains mostly handwritten text</li>
                        <li>The file is corrupted or incomplete</li>
                      </ul>
                      <p className="text-sm text-yellow-800 mt-3">
                        <strong>Recommendation:</strong> Try uploading a clearer scan or a typed report in PDF format for better results.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              { }

              { }
              {(shouldShowSection(patientInfo, 'object') || (editMode && canEdit)) && (
                <div className="card p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <User className="w-6 h-6 text-primary-600" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Patient Demographics</h2>
                    </div>
                    {!isPrinting && canEdit && (
                      <div className="flex items-center gap-2">
                        {editMode && editSection === 'patient_info' ? (
                          <>
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit('patient_info')}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {editMode && editSection === 'patient_info' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={editData.name || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                        <input
                          type="number"
                          value={editData.age || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                        <select
                          value={editData.gender || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, gender: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                        <select
                          value={editData.blood_group || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, blood_group: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Patient ID / MRN</label>
                        <input
                          type="text"
                          value={editData.patient_id || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, patient_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                        <input
                          type="text"
                          value={editData.contact || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, contact: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <textarea
                          value={editData.address || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Allergies (comma-separated)</label>
                        <input
                          type="text"
                          value={editData.allergies ? editData.allergies.join(', ') : ''}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            allergies: e.target.value.split(',').map(a => a.trim()).filter(a => a)
                          }))}
                          placeholder="e.g., Penicillin, Peanuts, Shellfish"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {patientInfo.name && (
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-primary-600 font-semibold uppercase tracking-wide">Full Name</p>
                              <ValidationIndicator fieldName="name" value={patientInfo.name} fieldType="name" />
                            </div>
                            <p className="text-lg font-bold text-gray-900">{patientInfo.name}</p>
                          </div>
                        )}
                        {patientInfo.age > 0 && (
                          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Age</p>
                              <ValidationIndicator fieldName="age" value={patientInfo.age} fieldType="age" />
                            </div>
                            <p className="text-lg font-bold text-gray-900">{patientInfo.age} years</p>
                          </div>
                        )}
                        {patientInfo.gender && (
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Gender</p>
                              <ValidationIndicator fieldName="gender" value={patientInfo.gender} fieldType="text" />
                            </div>
                            <p className="text-lg font-bold text-gray-900">{patientInfo.gender}</p>
                          </div>
                        )}
                        {patientInfo.blood_group && (
                          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">Blood Group</p>
                              <ValidationIndicator fieldName="blood_group" value={patientInfo.blood_group} fieldType="text" />
                            </div>
                            <p className="text-lg font-bold text-gray-900">{patientInfo.blood_group}</p>
                          </div>
                        )}
                        {patientInfo.patient_id && (
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Patient ID / MRN</p>
                              <ValidationIndicator fieldName="patient_id" value={patientInfo.patient_id} fieldType="text" />
                            </div>
                            <p className="text-lg font-bold text-gray-900">{patientInfo.patient_id}</p>
                          </div>
                        )}
                        {patientInfo.contact && (
                          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">Contact Number</p>
                              <ValidationIndicator fieldName="contact" value={patientInfo.contact} fieldType="text" />
                            </div>
                            <p className="text-lg font-bold text-gray-900">{patientInfo.contact}</p>
                          </div>
                        )}
                        {patientInfo.address && (
                          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 border border-teal-200 md:col-span-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide">Address</p>
                              <ValidationIndicator fieldName="address" value={patientInfo.address} fieldType="text" />
                            </div>
                            <p className="text-base font-semibold text-gray-900">{patientInfo.address}</p>
                          </div>
                        )}
                      </div>

                      {patientInfo.allergies && patientInfo.allergies.length > 0 && (
                        <div className="mt-6 p-5 bg-red-50 border-2 border-red-300 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-red-700" />
                            <p className="text-sm font-bold text-red-800 uppercase tracking-wide">Known Allergies</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {patientInfo.allergies.map((allergy, index) => (
                              <span key={index} className="px-4 py-2 bg-red-200 text-red-900 rounded-lg text-sm font-bold border border-red-400">
                                ⚠️ {allergy}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              { }
              {userProfile?.role === 'PATIENT' && report.suggested_doctors && report.suggested_doctors.length > 0 && (
                <div className="card p-6 border border-gray-100 print:hidden">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Stethoscope className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Recommended Doctors</h2>
                      <p className="text-sm text-gray-600">
                        {report.medical_specialty && `Specialty: ${report.medical_specialty}`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {report.suggested_doctors.slice(0, 5).map((doctor, index) => (
                      <div
                        key={doctor.doctor_id}
                        className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 hover:shadow-md transition-all"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                            #{index + 1}
                          </div>
                          <div className="mt-2 text-center">
                            <div className="text-xs font-bold text-green-700">
                              {(doctor.match_score * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-500">Match</div>
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            Dr. {doctor.doctor_name}
                          </h3>

                          {doctor.specializations && doctor.specializations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {doctor.specializations.map((spec, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium"
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="text-sm text-gray-700 mb-3">
                            <span className="font-semibold">Why recommended:</span> {doctor.match_reason}
                          </p>

                          {!report.assigned_doctor_id && (
                            <button
                              onClick={async () => {
                                try {
                                  const response = await api.post(`/medical-reports/${reportId}/assign-doctor`, {
                                    doctor_id: doctor.doctor_id
                                  })
                                  if (response.data.success) {
                                    toast.success(`Dr. ${doctor.doctor_name} assigned successfully!`)
                                    fetchReport() // Reload report
                                  }
                                } catch (error) {
                                  toast.error('Failed to assign doctor')
                                }
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                            >
                              Assign This Doctor
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {report.suggested_doctors.length > 5 && (
                    <p className="text-sm text-gray-500 text-center mt-4">
                      Showing top 5 of {report.suggested_doctors.length} recommended doctors
                    </p>
                  )}
                </div>
              )}

              { }
              {userProfile?.role === 'DOCTOR' && report.medical_specialty && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-lg p-4 border border-purple-200 print:hidden">
                  <div className="flex items-center gap-3">
                    <Stethoscope className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600 font-semibold">Required Medical Specialty</p>
                      <p className="text-lg font-bold text-purple-900">{report.medical_specialty}</p>
                    </div>
                  </div>
                </div>
              )}

              { }
              {(shouldShowSection(diagnoses, 'array') || (editMode && canEdit)) ? (
                <div className="card p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Stethoscope className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Clinical Diagnoses</h2>
                        <p className="text-sm text-gray-600">Identified conditions and diagnoses</p>
                      </div>
                    </div>
                    {!isPrinting && canEdit && (
                      <div className="flex items-center gap-2">
                        {editMode && editSection === 'diagnoses' ? (
                          <>
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit('diagnoses')}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {editMode && editSection === 'diagnoses' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Edit Diagnoses</h3>
                        <button
                          onClick={() => addArrayItem('diagnoses', '')}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Diagnosis
                        </button>
                      </div>
                      {editData.diagnoses?.map((diagnosis, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={diagnosis}
                            onChange={(e) => updateArrayItem('diagnoses', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Enter diagnosis..."
                          />
                          <button
                            onClick={() => removeArrayItem('diagnoses', index)}
                            className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(!editData.diagnoses || editData.diagnoses.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No diagnoses added yet. Click "Add Diagnosis" to start.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {diagnoses.map((diagnosis, index) => (
                          <div key={index} className="flex items-start gap-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border-l-4 border-red-500 hover:shadow-md transition-shadow">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                              {index + 1}
                            </div>
                            <div className="flex-1 pt-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="font-semibold text-gray-900 text-base leading-relaxed flex-1">{diagnosis}</p>
                                <ValidationIndicator fieldName="diagnosis" value={diagnosis} fieldType="diagnosis" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      { }
                      {icd10Codes.length > 0 && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-bold text-primary-800 mb-3 uppercase tracking-wide">ICD-10 Codes</p>
                          <div className="flex flex-wrap gap-2">
                            {icd10Codes.map((code, index) => (
                              <span key={index} className="px-3 py-1 bg-blue-200 text-blue-900 rounded-md text-sm font-mono font-semibold border border-blue-300">
                                {code}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="card p-8 text-center border border-gray-100">
                  <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No diagnoses extracted from this report</p>
                  {!isPrinting && canEdit && (
                    <button
                      onClick={() => startEdit('diagnoses')}
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Add Diagnoses
                    </button>
                  )}
                </div>
              )}

              { }
              {(shouldShowSection(symptoms, 'array') || (editMode && canEdit)) ? (
                <div className="card p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Reported Symptoms</h2>
                        <p className="text-sm text-gray-600">Patient complaints and clinical observations</p>
                      </div>
                    </div>
                    {!isPrinting && canEdit && (
                      <div className="flex items-center gap-2">
                        {editMode && editSection === 'symptoms' ? (
                          <>
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit('symptoms')}
                            className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {editMode && editSection === 'symptoms' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Edit Symptoms</h3>
                        <button
                          onClick={() => addArrayItem('symptoms', '')}
                          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          <Plus className="w-5 h-5" />
                          Add New Symptom
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {editData.symptoms?.map((symptom, index) => (
                          <div key={`symptom-${index}-${symptom}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-transparent hover:border-yellow-300 transition-all duration-200">
                            <span className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            <input
                              ref={index === (editData.symptoms?.length || 0) - 1 ? lastSymptomInputRef : null}
                              type="text"
                              value={symptom}
                              onChange={(e) => updateArrayItem('symptoms', index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                              placeholder="Enter symptom..."
                            />
                            <button
                              onClick={() => removeArrayItem('symptoms', index)}
                              className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {(!editData.symptoms || editData.symptoms.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No symptoms added yet. Click "Add Symptom" to start.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {symptoms.map((symptom, index) => (
                        <div key={index} className="px-5 py-3 bg-gradient-to-br from-yellow-50 to-orange-50 text-yellow-900 rounded-lg text-sm font-semibold border-2 border-yellow-200 hover:shadow-md transition-shadow">
                          <span className="mr-2">🔸</span>
                          {symptom}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card p-8 text-center border border-gray-100">
                  <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No symptoms extracted from this report</p>
                  {!isPrinting && canEdit && (
                    <button
                      onClick={() => startEdit('symptoms')}
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Add Symptoms
                    </button>
                  )}
                </div>
              )}

              { }
              {shouldShowSection(medicalHistory, 'array') && (
                <div className="card p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Clipboard className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Medical History</h2>
                      <p className="text-sm text-gray-600">Past medical conditions and history</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {medicalHistory.map((history, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                        <div className="flex-shrink-0 w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                        <p className="text-gray-900 font-medium leading-relaxed">{history}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              { }
              {shouldShowSection(abnormalFindings, 'array') && (
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg p-6 border-2 border-red-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-200 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-700" />
                    </div>
                    <h2 className="text-xl font-bold text-red-900">⚠️ Abnormal Findings</h2>
                  </div>

                  <div className="space-y-3">
                    {abnormalFindings.map((finding, index) => (
                      <div key={index} className="flex flex-col gap-2 p-4 bg-white rounded-lg border-l-4 border-red-500 hover:shadow-md transition-shadow">
                        {typeof finding === 'object' && finding !== null ? (
                          <>
                            <div className="flex items-center gap-3">
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                              <p className="text-gray-900 font-bold text-lg">{finding.test_name || finding.name}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-8 mt-1 p-3 bg-red-50/50 rounded-lg border border-red-100">
                              <div>
                                <p className="text-[10px] text-red-600 uppercase font-black tracking-wider mb-1">Result</p>
                                <p className="text-base font-bold text-red-700">{finding.result ?? finding.value ?? finding.result_value}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Unit</p>
                                <p className="text-sm font-semibold text-gray-700">{finding.units || finding.unit || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Reference Range</p>
                                <p className="text-sm font-semibold text-gray-700">{finding.bio_ref_interval || finding.reference_range || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Interpretation</p>
                                <div className="inline-block px-2 py-1 bg-red-600 text-white text-[10px] font-black rounded uppercase">
                                  {finding.interpretation || finding.abnormality_type || 'Abnormal'}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-gray-900 font-medium">{finding}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          { }
          {(activeTab === 'vitals' || isPrinting) && (
            <>
              { }
              {isPrinting && (
                <div className="hidden print:block mb-4 pb-2 border-b-2 border-gray-300 page-break-before">
                  <h2 className="text-xl font-bold">Vital Signs</h2>
                </div>
              )}

              { }
              {shouldShowSection(vitalSigns, 'object') ? (
                <div className="card p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Heart className="w-6 h-6 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Vital Signs Monitoring</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {vitalSigns.blood_pressure && (
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
                        <div className="flex items-center justify-between mb-3">
                          <Droplet className="w-8 h-8 text-red-500" />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">BP</span>
                            <ValidationIndicator fieldName="blood_pressure" value={vitalSigns.blood_pressure} fieldType="blood_pressure" />
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{vitalSigns.blood_pressure}</p>
                        <p className="text-sm text-gray-600">Blood Pressure</p>
                        <p className="text-xs text-gray-500 mt-2">Normal: 120/80 mmHg</p>
                      </div>
                    )}

                    {vitalSigns.heart_rate > 0 && (
                      <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-6 border border-pink-200">
                        <div className="flex items-center justify-between mb-3">
                          <Heart className="w-8 h-8 text-pink-500" />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-pink-600 bg-pink-100 px-2 py-1 rounded">HR</span>
                            <ValidationIndicator fieldName="heart_rate" value={vitalSigns.heart_rate} fieldType="age" />
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{vitalSigns.heart_rate}</p>
                        <p className="text-sm text-gray-600">Heart Rate (bpm)</p>
                        <p className="text-xs text-gray-500 mt-2">Normal: 60-100 bpm</p>
                      </div>
                    )}

                    {vitalSigns.temperature > 0 && (
                      <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
                        <div className="flex items-center justify-between mb-3">
                          <Thermometer className="w-8 h-8 text-orange-500" />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded">TEMP</span>
                            <ValidationIndicator fieldName="temperature" value={vitalSigns.temperature} fieldType="text" />
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{vitalSigns.temperature}°F</p>
                        <p className="text-sm text-gray-600">Temperature</p>
                        <p className="text-xs text-gray-500 mt-2">Normal: 98.6°F</p>
                      </div>
                    )}

                    {vitalSigns.oxygen_saturation > 0 && (
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <Wind className="w-8 h-8 text-primary-500" />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-primary-600 bg-primary-100 px-2 py-1 rounded">SpO2</span>
                            <ValidationIndicator fieldName="oxygen_saturation" value={vitalSigns.oxygen_saturation} fieldType="text" />
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{vitalSigns.oxygen_saturation}%</p>
                        <p className="text-sm text-gray-600">Oxygen Saturation</p>
                        <p className="text-xs text-gray-500 mt-2">Normal: 95-100%</p>
                      </div>
                    )}

                    {vitalSigns.respiratory_rate > 0 && (
                      <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-6 border border-teal-200">
                        <div className="flex items-center justify-between mb-3">
                          <Wind className="w-8 h-8 text-teal-500" />
                          <span className="text-xs font-semibold text-teal-600 bg-teal-100 px-2 py-1 rounded">RR</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{vitalSigns.respiratory_rate}</p>
                        <p className="text-sm text-gray-600">Respiratory Rate</p>
                        <p className="text-xs text-gray-500 mt-2">Normal: 12-20/min</p>
                      </div>
                    )}

                    {vitalSigns.weight > 0 && (
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                        <div className="flex items-center justify-between mb-3">
                          <TrendingUp className="w-8 h-8 text-purple-500" />
                          <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">WT</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{vitalSigns.weight}</p>
                        <p className="text-sm text-gray-600">Weight (kg)</p>
                      </div>
                    )}

                    {vitalSigns.height > 0 && (
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
                        <div className="flex items-center justify-between mb-3">
                          <TrendingUp className="w-8 h-8 text-indigo-500" />
                          <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">HT</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{vitalSigns.height}</p>
                        <p className="text-sm text-gray-600">Height (cm)</p>
                      </div>
                    )}

                    {vitalSigns.bmi > 0 && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <Activity className="w-8 h-8 text-green-500" />
                          <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">BMI</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{vitalSigns.bmi}</p>
                        <p className="text-sm text-gray-600">Body Mass Index</p>
                        <p className="text-xs text-gray-500 mt-2">Normal: 18.5-24.9</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card p-12 text-center border border-gray-100">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Vital Signs Data</h3>
                  <p className="text-gray-600">No vital signs information was extracted from this report.</p>
                </div>
              )}
            </>
          )}

          { }
          {(activeTab === 'labs' || isPrinting) && (
            <>
              { }
              {isPrinting && (
                <div className="hidden print:block mb-4 pb-2 border-b-2 border-gray-300 page-break-before">
                  <h2 className="text-xl font-bold">Laboratory Results</h2>
                </div>
              )}

              { }
              {shouldShowSection(labResults, 'array') ? (
                <div className="card border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Activity className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Laboratory Test Results</h2>
                        <p className="text-sm text-gray-600">Complete blood work and diagnostic tests</p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-semibold border border-green-300">
                        <CheckCircle className="w-4 h-4" /> Normal
                      </span>
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-semibold border border-red-300">
                        <XCircle className="w-4 h-4" /> Abnormal
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-100 to-gray-50">
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            Test Name
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            Result Value
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            Reference Range
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {labResults.map((lab, index) => (
                          <tr key={index} className={`hover:bg-gray-50 transition-colors ${lab.is_abnormal ? 'bg-red-50 hover:bg-red-100' : ''
                            }`}>
                            <td className="px-6 py-4 border-r border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${lab.is_abnormal ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                                  }`}></div>
                                <span className="font-bold text-gray-900 text-base">{lab.test_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-100 min-w-[200px]">
                              {typeof lab._original_value === 'object' && lab._original_value !== null ? (
                                <div className="space-y-1.5 py-1">
                                  {Object.entries(lab._original_value).map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center gap-4 text-xs border-b border-gray-50 pb-1 last:border-0 last:pb-0">
                                      <span className="font-bold text-gray-400 uppercase text-[10px] tracking-tight text-left max-w-[120px] truncate">{k}</span>
                                      <span className={`font-black text-right ${lab.is_abnormal ? 'text-red-600' : 'text-gray-900'}`}>
                                        {v} <span className="text-[10px] font-normal text-gray-400 capitalize">{typeof lab._original_unit === 'object' ? lab._original_unit[k] : ''}</span>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <span className={`text-2xl font-bold ${lab.is_abnormal ? 'text-red-600' : 'text-gray-900'}`}>{lab.value}</span>
                                  <span className="text-xs font-semibold text-gray-500 mt-1">{lab.unit}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center border-r border-gray-100 min-w-[180px]">
                              {typeof lab._original_reference === 'object' && lab._original_reference !== null ? (
                                <div className="space-y-1 text-[10px] text-gray-400 py-1 text-left">
                                  {Object.entries(lab._original_reference).map(([k, v]) => (
                                    <div key={k} className="border-b border-gray-50 pb-0.5 last:border-0 last:pb-0">
                                      <span className="font-bold">{k}:</span> {v}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-md">
                                  {lab.reference_range}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {lab.is_abnormal ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md">
                                    <XCircle className="w-4 h-4" />
                                    {lab.abnormality_type}
                                  </span>
                                </div>
                              ) : (
                                <span className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 w-fit mx-auto shadow-md">
                                  <CheckCircle className="w-4 h-4" />
                                  NORMAL
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  { }
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        <strong>Total Tests:</strong> {labResults.length}
                      </span>
                      <span className="text-gray-600">
                        <strong>Normal:</strong> <span className="text-green-600 font-bold">{labResults.filter(l => !l.is_abnormal).length}</span>
                      </span>
                      <span className="text-gray-600">
                        <strong>Abnormal:</strong> <span className="text-red-600 font-bold">{labResults.filter(l => l.is_abnormal).length}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card p-12 text-center border border-gray-100">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Lab Results</h3>
                  <p className="text-gray-600">No laboratory test results were extracted from this report.</p>
                </div>
              )}
            </>
          )}

          { }
          {(activeTab === 'medications' || isPrinting) && (
            <>
              { }
              {isPrinting && (
                <div className="hidden print:block mb-4 pb-2 border-b-2 border-gray-300 page-break-before">
                  <h2 className="text-xl font-bold">Current Medications</h2>
                </div>
              )}

              { }
              {(shouldShowSection(medications, 'array') || (editMode && canEdit)) ? (
                <div className="space-y-6">
                  <div className="card p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Pill className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">Current Medications</h2>
                          <p className="text-sm text-gray-600">Active prescriptions and treatment plan</p>
                        </div>
                      </div>
                      {!isPrinting && canEdit && (
                        <div className="flex items-center gap-2">
                          {editMode && editSection === 'medications' ? (
                            <>
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEdit('medications')}
                              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {editMode && editSection === 'medications' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Edit Medications</h3>
                          <button
                            onClick={() => addArrayItem('current_medications', {
                              name: '',
                              dosage: '',
                              frequency: '',
                              duration: '',
                              route: 'Oral',
                              instructions: ''
                            })}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Medication
                          </button>
                        </div>
                        {editData.current_medications?.map((med, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-semibold text-gray-900">Medication {index + 1}</h4>
                              <button
                                onClick={() => removeArrayItem('current_medications', index)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Medication Name</label>
                                <input
                                  type="text"
                                  value={med.name || ''}
                                  onChange={(e) => updateArrayItem('current_medications', index, { ...med, name: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="e.g., Metformin"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
                                <input
                                  type="text"
                                  value={med.dosage || ''}
                                  onChange={(e) => updateArrayItem('current_medications', index, { ...med, dosage: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="e.g., 500mg"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                                <input
                                  type="text"
                                  value={med.frequency || ''}
                                  onChange={(e) => updateArrayItem('current_medications', index, { ...med, frequency: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="e.g., Twice daily"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                                <input
                                  type="text"
                                  value={med.duration || ''}
                                  onChange={(e) => updateArrayItem('current_medications', index, { ...med, duration: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="e.g., Ongoing"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
                                <select
                                  value={med.route || 'Oral'}
                                  onChange={(e) => updateArrayItem('current_medications', index, { ...med, route: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                  <option value="Oral">Oral</option>
                                  <option value="Injection">Injection</option>
                                  <option value="Topical">Topical</option>
                                  <option value="Inhalation">Inhalation</option>
                                  <option value="IV">IV</option>
                                  <option value="IM">IM</option>
                                  <option value="Subcutaneous">Subcutaneous</option>
                                </select>
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                                <textarea
                                  value={med.instructions || ''}
                                  onChange={(e) => updateArrayItem('current_medications', index, { ...med, instructions: e.target.value })}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="e.g., Take with meals to reduce stomach upset"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!editData.current_medications || editData.current_medications.length === 0) && (
                          <div className="text-center py-8 text-gray-500">
                            <p>No medications added yet. Click "Add Medication" to start.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {medications.map((med, index) => (
                          <div key={index} className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-200 rounded-lg">
                                  <Pill className="w-5 h-5 text-purple-700" />
                                </div>
                                <h3 className="font-bold text-xl text-gray-900">{med.name}</h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-purple-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm">
                                  {med.route}
                                </span>
                                <ValidationIndicator fieldName="medication" value={med.name} fieldType="medication" />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-100">
                                <span className="text-xs text-purple-600 font-bold uppercase tracking-wide min-w-[80px]">Dosage:</span>
                                <span className="font-bold text-gray-900">{med.dosage}</span>
                              </div>
                              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-100">
                                <span className="text-xs text-purple-600 font-bold uppercase tracking-wide min-w-[80px]">Frequency:</span>
                                <span className="font-bold text-gray-900">{med.frequency}</span>
                              </div>
                              <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-100">
                                <span className="text-xs text-purple-600 font-bold uppercase tracking-wide min-w-[80px]">Duration:</span>
                                <span className="font-bold text-gray-900">{med.duration}</span>
                              </div>
                              {med.instructions && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="flex items-start gap-2 mb-1">
                                    <Info className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-primary-600 font-semibold uppercase tracking-wide">Instructions</p>
                                  </div>
                                  <p className="text-sm text-gray-700 font-medium ml-6">{med.instructions}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  { }
                  {clinicalSuggestions.filter(s => s.category === 'MONITORING' || s.category === 'MEDICATION').length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border-2 border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-200 rounded-lg">
                          <Brain className="w-6 h-6 text-primary-700" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Medication Guidance & Monitoring</h3>
                          <p className="text-sm text-gray-600">AI-generated recommendations for medication management</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {clinicalSuggestions
                          .filter(s => s.category === 'MONITORING' || s.category === 'MEDICATION')
                          .map((suggestion, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                              <div className="flex items-start gap-3">
                                <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${suggestion.category === 'MONITORING' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                                  }`}>
                                  {suggestion.category}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-900 mb-1">{suggestion.suggestion}</p>
                                  <p className="text-xs text-gray-600">{suggestion.reasoning}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card p-12 text-center border border-gray-100">
                  <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Medications</h3>
                  <p className="text-gray-600">No medication information was extracted from this report.</p>
                  {!isPrinting && canEdit && (
                    <button
                      onClick={() => startEdit('medications')}
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Add Medications
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          { }
          {(activeTab === 'suggestions' || isPrinting) && (
            <>
              { }
              {isPrinting && (
                <div className="hidden print:block mb-4 pb-2 border-b-2 border-gray-300 page-break-before">
                  <h2 className="text-xl font-bold">AI Clinical Recommendations</h2>
                </div>
              )}

              { }
              {shouldShowSection(clinicalSuggestions, 'array') ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-xl p-8 text-white">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Brain className="w-10 h-10" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold">AI Clinical Decision Support</h2>
                        <p className="text-blue-100 mt-1 text-base">
                          Intelligent recommendations powered by advanced medical AI analysis
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                      <p className="text-sm text-white/90 leading-relaxed">
                        ⚕️ <strong>Important:</strong> All AI-generated suggestions are for informational and advisory purposes only.
                        Final medical decisions must be made by licensed healthcare professionals after proper examination.
                      </p>
                    </div>
                  </div>

                  { }
                  <div className="card p-4 border border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {['ALL', 'MEDICATION', 'ALERT', 'TEST', 'MONITORING', 'REFERRAL', 'LIFESTYLE', 'EDUCATION', 'PREVENTION'].map((category) => {
                        const count = category === 'ALL'
                          ? clinicalSuggestions.length
                          : clinicalSuggestions.filter(s => s.category === category).length;

                        if (count === 0 && category !== 'ALL') return null;

                        return (
                          <button
                            key={category}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${category === 'ALL'
                              ? 'bg-blue-500 text-white'
                              : category === 'MEDICATION' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                : category === 'ALERT' ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : category === 'TEST' ? 'bg-primary-100 text-primary-800 hover:bg-blue-200'
                                    : category === 'MONITORING' ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : category === 'REFERRAL' ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                                        : category === 'LIFESTYLE' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                          : category === 'EDUCATION' ? 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                          >
                            {category} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {clinicalSuggestions.map((suggestion, index) => (
                    <div key={index} className="card border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 border-b-2 border-gray-200">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide shadow-sm ${suggestion.category === 'MEDICATION' ? 'bg-purple-500 text-white' :
                                suggestion.category === 'TEST' ? 'bg-blue-500 text-white' :
                                  suggestion.category === 'REFERRAL' ? 'bg-green-500 text-white' :
                                    suggestion.category === 'MONITORING' ? 'bg-teal-500 text-white' :
                                      suggestion.category === 'LIFESTYLE' ? 'bg-orange-500 text-white' :
                                        suggestion.category === 'EDUCATION' ? 'bg-cyan-500 text-white' :
                                          suggestion.category === 'PREVENTION' ? 'bg-lime-500 text-white' :
                                            'bg-red-500 text-white'
                                }`}>
                                {suggestion.category}
                              </span>
                              <span className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide shadow-sm ${suggestion.priority === 'CRITICAL' ? 'bg-red-600 text-white animate-pulse' :
                                suggestion.priority === 'HIGH' ? 'bg-orange-500 text-white' :
                                  suggestion.priority === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                                    'bg-gray-500 text-white'
                                }`}>
                                {suggestion.priority === 'CRITICAL' ? '🚨' : suggestion.priority === 'HIGH' ? '⚠️' : '📋'} {suggestion.priority}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-300 shadow-sm">
                            <span className="text-sm font-semibold text-gray-700">AI Confidence:</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                                <div
                                  className={`h-full rounded-full transition-all ${suggestion.confidence >= 0.8 ? 'bg-green-500' :
                                    suggestion.confidence >= 0.6 ? 'bg-blue-500' :
                                      'bg-yellow-500'
                                    }`}
                                  style={{ width: `${suggestion.confidence * 100}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-gray-900 text-base">{Math.round(suggestion.confidence * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="mb-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-primary-100 rounded-lg">
                              <Brain className="w-5 h-5 text-primary-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Clinical Recommendation</h3>
                          </div>
                          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
                            <p className="text-gray-900 leading-relaxed text-base font-medium">{suggestion.suggestion}</p>
                          </div>
                        </div>

                        <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Clipboard className="w-5 h-5 text-gray-600" />
                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Medical Rationale</h4>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{suggestion.reasoning}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-12 text-center border border-gray-100">
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No AI Suggestions</h3>
                  <p className="text-gray-600">No clinical metadata available.</p>
                </div>
              )}
            </>
          )}
          {activeTab === 'ai-chat' && (
            <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-fadeIn">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Brain className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Medical AI Assistant</h3>
                    <p className="text-xs text-gray-500">Ask anything about this report</p>
                  </div>
                </div>
                {loadingHistory && <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {aiChatHistory.length === 0 && !loadingHistory ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-blue-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h4>
                    <p className="text-sm text-gray-500 max-w-xs">
                      Ask a question like "What does my hemoglobin level mean?" or "Explain the findings in simple terms."
                    </p>
                  </div>
                ) : (
                  <>
                    {aiChatHistory.map((msg, idx) => (
                      <div
                        key={msg.id || idx}
                        className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow">
                            <span className="text-white text-[10px] font-bold">AI</span>
                          </div>
                        )}
                        <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <div className="text-sm leading-relaxed space-y-1">
                              {msg.content.split('\n').map((line, li) => {
                                const trimmed = line.trim();
                                if (!trimmed) return <div key={li} className="h-1" />;
                                const isBullet = /^[-*•]\s/.test(trimmed);
                                const isNum   = /^\d+\.\s/.test(trimmed);
                                const renderInline = (text) => {
                                  const parts = text.split(/(\*\*[^*]+\*\*)/g);
                                  return parts.map((p, pi) =>
                                    p.startsWith('**') && p.endsWith('**')
                                      ? <strong key={pi} className="font-semibold text-gray-900">{p.slice(2,-2)}</strong>
                                      : <span key={pi}>{p}</span>
                                  );
                                };
                                if (isBullet) return (
                                  <div key={li} className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                    <span>{renderInline(trimmed.replace(/^[-*•]\s/, ''))}</span>
                                  </div>
                                );
                                if (isNum) return (
                                  <div key={li} className="flex items-start gap-2">
                                    <span className="text-blue-500 font-semibold text-xs mt-0.5 shrink-0">{trimmed.match(/^\d+/)[0]}.</span>
                                    <span>{renderInline(trimmed.replace(/^\d+\.\s/, ''))}</span>
                                  </div>
                                );
                                return <p key={li}>{renderInline(trimmed)}</p>;
                              })}
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          )}
                          <p className={`text-[10px] mt-2 text-right ${
                            msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center shrink-0 shadow">
                            <span className="text-white text-[10px] font-bold">You</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {isAskingAI && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-200">
                          <div className="flex gap-1.5 items-center">
                            <span className="text-xs text-gray-500 mr-2 font-medium italic">AI is thinking</span>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendAIQuestion} className="p-4 border-t border-gray-100 bg-white shadow-inner">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder={!report.extracted_text && report.status !== 'ANALYZED' ? "Analyze report first to enable chat..." : "Type your question here about this report..."}
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                    disabled={isAskingAI || (!report.extracted_text && report.status !== 'ANALYZED')}
                  />
                  <button
                    type="submit"
                    disabled={!aiQuestion.trim() || isAskingAI || (!report.extracted_text && report.status !== 'ANALYZED')}
                    className={`absolute right-2 p-2 rounded-lg transition-all ${
                      !aiQuestion.trim() || isAskingAI || (!report.extracted_text && report.status !== 'ANALYZED')
                        ? 'text-gray-300' 
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                {!report.extracted_text && report.status !== 'ANALYZED' && (
                  <p className="text-[10px] text-center text-amber-600 mt-2 font-medium">
                    ⚠️ AI Chat requires the report to be analyzed first.
                  </p>
                )}
                <p className="text-[10px] text-center text-gray-400 mt-2">
                  AI provides information based on your report. Always consult your doctor for official medical advice.
                </p>
              </form>
            </div>
          )}
        </div>

        { }
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 mt-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-2 bg-yellow-200 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-700" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-yellow-900 mb-2">⚕️ Medical Disclaimer</h3>
              <p className="text-sm text-yellow-800 leading-relaxed">
                <strong>Important:</strong> All AI-generated analysis, suggestions, and clinical decision support recommendations are for <strong>informational and advisory purposes only</strong>.
                These should not be considered as medical advice, diagnosis, or treatment recommendations.
                All medical decisions, diagnoses, prescriptions, and treatments must be made by licensed healthcare professionals
                after proper examination and consideration of the patient's complete medical history.
                Always consult with qualified medical practitioners for proper diagnosis and treatment.
              </p>
            </div>
          </div>
        </div>

        { }
        {showAnalysisModal && analysisResults && !isPrinting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
              { }
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Brain className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">✨ AI Analysis Complete!</h2>
                      <p className="text-blue-100 text-sm mt-1">Medical report has been successfully analyzed</p>
                      {analysisResults.analyzed_by && (
                        <div className="flex items-center gap-2 mt-2">
                          
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAnalysisModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              { }
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
                { }
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="w-5 h-5 text-primary-600" />
                      <span className="text-xs font-bold text-primary-600 uppercase">Diagnoses</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{analysisResults.diagnoses?.length || 0}</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      <span className="text-xs font-bold text-green-600 uppercase">Lab Tests</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{analysisResults.lab_results?.length || 0}</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="w-5 h-5 text-purple-600" />
                      <span className="text-xs font-bold text-purple-600 uppercase">Medications</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{analysisResults.current_medications?.length || 0}</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-5 h-5 text-orange-600" />
                      <span className="text-xs font-bold text-orange-600 uppercase">AI Insights</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{analysisResults.clinical_suggestions?.length || 0}</p>
                  </div>
                </div>

                { }
                {analysisResults.severity_level && (
                  <div className={`p-4 rounded-xl mb-6 border-2 ${analysisResults.severity_level === 'CRITICAL' ? 'bg-red-50 border-red-300' :
                    analysisResults.severity_level === 'HIGH' ? 'bg-orange-50 border-orange-300' :
                      analysisResults.severity_level === 'MEDIUM' ? 'bg-yellow-50 border-yellow-300' :
                        'bg-green-50 border-green-300'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`text-4xl ${analysisResults.severity_level === 'CRITICAL' ? 'animate-pulse' : ''
                        }`}>
                        {getSeverityIcon(analysisResults.severity_level)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 uppercase">Overall Severity</p>
                        <p className={`text-2xl font-bold ${analysisResults.severity_level === 'CRITICAL' ? 'text-red-700' :
                          analysisResults.severity_level === 'HIGH' ? 'text-orange-700' :
                            analysisResults.severity_level === 'MEDIUM' ? 'text-yellow-700' :
                              'text-green-700'
                          }`}>
                          {analysisResults.severity_level}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                { }
                {analysisResults.patient_info && Object.keys(analysisResults.patient_info).some(key => analysisResults.patient_info[key]) && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-200">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-primary-600" />
                      <h3 className="font-bold text-gray-900 text-lg">Patient Information</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {analysisResults.patient_info.name && (
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-primary-600 font-semibold mb-1">Name</p>
                          <p className="text-sm font-bold text-gray-900">{analysisResults.patient_info.name}</p>
                        </div>
                      )}
                      {analysisResults.patient_info.age > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-primary-600 font-semibold mb-1">Age</p>
                          <p className="text-sm font-bold text-gray-900">{analysisResults.patient_info.age} years</p>
                        </div>
                      )}
                      {analysisResults.patient_info.gender && (
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-primary-600 font-semibold mb-1">Gender</p>
                          <p className="text-sm font-bold text-gray-900">{analysisResults.patient_info.gender}</p>
                        </div>
                      )}
                      {analysisResults.patient_info.blood_group && (
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-primary-600 font-semibold mb-1">Blood Group</p>
                          <p className="text-sm font-bold text-gray-900">{analysisResults.patient_info.blood_group}</p>
                        </div>
                      )}
                      {analysisResults.patient_info.patient_id && (
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-primary-600 font-semibold mb-1">Patient ID</p>
                          <p className="text-sm font-bold text-gray-900">{analysisResults.patient_info.patient_id}</p>
                        </div>
                      )}
                      {analysisResults.patient_info.contact && (
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-primary-600 font-semibold mb-1">Contact</p>
                          <p className="text-sm font-bold text-gray-900">{analysisResults.patient_info.contact}</p>
                        </div>
                      )}
                    </div>
                    {analysisResults.patient_info.allergies && analysisResults.patient_info.allergies.length > 0 && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700 font-bold mb-2 uppercase">⚠️ Known Allergies</p>
                        <div className="flex flex-wrap gap-2">
                          {analysisResults.patient_info.allergies.map((allergy, index) => (
                            <span key={index} className="px-3 py-1 bg-red-200 text-red-900 rounded-full text-xs font-bold">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                { }
                {analysisResults.vital_signs && Object.keys(analysisResults.vital_signs).some(key => analysisResults.vital_signs[key]) && (
                  <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-5 mb-6 border border-pink-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Heart className="w-5 h-5 text-pink-600" />
                      <h3 className="font-bold text-gray-900 text-lg">Vital Signs</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {analysisResults.vital_signs.blood_pressure && (
                        <div className="bg-white rounded-lg p-3 border border-pink-100">
                          <p className="text-xs text-pink-600 font-semibold mb-1">Blood Pressure</p>
                          <p className="text-lg font-bold text-gray-900">{analysisResults.vital_signs.blood_pressure}</p>
                          <p className="text-xs text-gray-500">mmHg</p>
                        </div>
                      )}
                      {analysisResults.vital_signs.heart_rate > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-pink-100">
                          <p className="text-xs text-pink-600 font-semibold mb-1">Heart Rate</p>
                          <p className="text-lg font-bold text-gray-900">{analysisResults.vital_signs.heart_rate}</p>
                          <p className="text-xs text-gray-500">bpm</p>
                        </div>
                      )}
                      {analysisResults.vital_signs.temperature > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-pink-100">
                          <p className="text-xs text-pink-600 font-semibold mb-1">Temperature</p>
                          <p className="text-lg font-bold text-gray-900">{analysisResults.vital_signs.temperature}°F</p>
                        </div>
                      )}
                      {analysisResults.vital_signs.oxygen_saturation > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-pink-100">
                          <p className="text-xs text-pink-600 font-semibold mb-1">SpO2</p>
                          <p className="text-lg font-bold text-gray-900">{analysisResults.vital_signs.oxygen_saturation}%</p>
                        </div>
                      )}
                      {analysisResults.vital_signs.respiratory_rate > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-pink-100">
                          <p className="text-xs text-pink-600 font-semibold mb-1">Respiratory Rate</p>
                          <p className="text-lg font-bold text-gray-900">{analysisResults.vital_signs.respiratory_rate}</p>
                          <p className="text-xs text-gray-500">/min</p>
                        </div>
                      )}
                      {analysisResults.vital_signs.weight > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-pink-100">
                          <p className="text-xs text-pink-600 font-semibold mb-1">Weight</p>
                          <p className="text-lg font-bold text-gray-900">{analysisResults.vital_signs.weight}</p>
                          <p className="text-xs text-gray-500">kg</p>
                        </div>
                      )}
                      {analysisResults.vital_signs.height > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-pink-100">
                          <p className="text-xs text-pink-600 font-semibold mb-1">Height</p>
                          <p className="text-lg font-bold text-gray-900">{analysisResults.vital_signs.height}</p>
                          <p className="text-xs text-gray-500">cm</p>
                        </div>
                      )}
                      {analysisResults.vital_signs.bmi > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-pink-100">
                          <p className="text-xs text-pink-600 font-semibold mb-1">BMI</p>
                          <p className="text-lg font-bold text-gray-900">{analysisResults.vital_signs.bmi}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                { }
                {analysisResults.diagnoses && analysisResults.diagnoses.length > 0 && (
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 mb-6 border border-red-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Stethoscope className="w-5 h-5 text-red-600" />
                      <h3 className="font-bold text-gray-900 text-lg">Diagnoses Identified ({analysisResults.diagnoses.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {analysisResults.diagnoses.map((diagnosis, index) => (
                        <div key={index} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-red-100">
                          <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-800 font-medium flex-1">{diagnosis}</span>
                        </div>
                      ))}
                    </div>
                    {analysisResults.icd10_codes && analysisResults.icd10_codes.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-primary-700 font-bold mb-2 uppercase">ICD-10 Codes</p>
                        <div className="flex flex-wrap gap-2">
                          {analysisResults.icd10_codes.map((code, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-200 text-blue-900 rounded-md text-xs font-mono font-bold">
                              {code}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                { }
                {analysisResults.symptoms && analysisResults.symptoms.length > 0 && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-5 mb-6 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-bold text-gray-900 text-lg">Reported Symptoms ({analysisResults.symptoms.length})</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysisResults.symptoms.map((symptom, index) => (
                        <span key={index} className="px-4 py-2 bg-yellow-100 text-yellow-900 rounded-lg text-sm font-semibold border border-yellow-300">
                          🔸 {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                { }
                {analysisResults.medical_history && analysisResults.medical_history.length > 0 && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 mb-6 border border-indigo-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Clipboard className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-gray-900 text-lg">Medical History</h3>
                    </div>
                    <div className="space-y-2">
                      {analysisResults.medical_history.map((history, index) => (
                        <div key={index} className="flex items-start gap-2 bg-white rounded-lg p-3 border border-indigo-100">
                          <span className="text-indigo-500 font-bold">•</span>
                          <span className="text-sm text-gray-800 font-medium">{history}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                { }
                {analysisResults.lab_results && analysisResults.lab_results.length > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 mb-6 border border-green-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-gray-900 text-lg">Laboratory Results ({analysisResults.lab_results?.length || 0})</h3>
                    </div>
                    <div className="space-y-2">
                      {normalizeLabResults(analysisResults.lab_results)?.map((lab, index) => {
                        const isComplex = typeof lab._original_value === 'object' && lab._original_value !== null;
                        return (
                          <div key={index} className={`bg-white rounded-lg p-4 border-l-4 shadow-sm hover:shadow-md transition-shadow ${lab.is_abnormal ? 'border-red-500 bg-red-50' : 'border-green-500'
                            }`}>
                            <div className={`flex ${isComplex ? 'flex-col gap-4' : 'items-center justify-between gap-4'}`}>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900 mb-1 leading-tight">{lab.test_name}</p>
                                {!isComplex && (
                                  <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Ref: {lab.reference_range}</p>
                                )}
                              </div>

                              <div className={`${isComplex ? 'w-full' : 'text-right flex-shrink-0'}`}>
                                {isComplex ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    {Object.entries(lab._original_value).map(([key, val]) => (
                                      <div key={key} className="flex justify-between items-center gap-4 border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight truncate max-w-[60%]">{key}</span>
                                        <span className={`text-[11px] font-black ${lab.is_abnormal ? 'text-red-600' : 'text-primary-600'}`}>
                                          {val} <span className="text-[9px] font-normal text-gray-400 capitalize">{typeof lab._original_unit === 'object' ? lab._original_unit[key] : ''}</span>
                                        </span>
                                      </div>
                                    ))}
                                    {typeof lab._original_reference === 'object' && lab._original_reference !== null && (
                                      <div className="col-span-full mt-2 pt-2 border-t border-dashed border-gray-300">
                                        <p className="text-[9px] font-black text-gray-300 uppercase mb-1">Reference Ranges:</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                          {Object.entries(lab._original_reference).map(([k, v]) => (
                                            <div key={k} className="text-[9px] text-gray-400">
                                              <span className="font-bold">{k}:</span> {v}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className={`text-xl font-bold tracking-tight ${lab.is_abnormal ? 'text-red-700' : 'text-gray-900'}`}>
                                    {lab.value} <span className="text-xs font-normal text-gray-500">{lab.unit}</span>
                                  </p>
                                )}
                                {lab.is_abnormal && (
                                  <span className="inline-block px-2 py-0.5 mt-1 bg-red-600 text-white text-[9px] font-black rounded uppercase tracking-wider">
                                    {lab.abnormality_type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                { }
                {analysisResults.current_medications && analysisResults.current_medications.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 mb-6 border border-purple-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Pill className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-gray-900 text-lg">Current Medications ({analysisResults.current_medications.length})</h3>
                    </div>
                    <div className="space-y-3">
                      {normalizeMedications(analysisResults.current_medications).map((med, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-purple-200">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-gray-900 text-base">{med.name}</h4>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                              {med.route}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                            <div>
                              <p className="text-gray-600">Dosage</p>
                              <p className="font-bold text-gray-900">{med.dosage}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Frequency</p>
                              <p className="font-bold text-gray-900">{med.frequency}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Duration</p>
                              <p className="font-bold text-gray-900">{med.duration}</p>
                            </div>
                          </div>
                          {med.instructions && (
                            <p className="text-xs text-gray-700 bg-blue-50 p-2 rounded border border-blue-100">
                              <strong>Instructions:</strong> {med.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                { }
                {analysisResults.abnormal_findings && analysisResults.abnormal_findings.length > 0 && (
                  <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-xl p-5 mb-6 border-2 border-red-300">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-700" />
                      <h3 className="font-bold text-red-900 shadow-sm">⚠️ Abnormal Findings</h3>
                    </div>
                    <div className="space-y-3">
                      {(analysisResults.abnormal_findings || []).map(smartParse).map((finding, index) => (
                        <div key={index} className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                          {typeof finding === 'object' && finding !== null ? (
                            <>
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <p className="text-sm font-bold text-gray-900">{finding.test_name || finding.name}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3 ml-6 mt-1 p-2 bg-red-50/30 rounded border border-red-50">
                                <div>
                                  <p className="text-[9px] text-red-600 uppercase font-black tracking-wider mb-0.5">Result</p>
                                  <p className="text-xs font-bold text-red-700">{finding.result ?? finding.value ?? finding.result_value}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Unit</p>
                                  <p className="text-xs font-semibold text-gray-700">{finding.units || finding.unit || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Range</p>
                                  <p className="text-xs font-semibold text-gray-700">{finding.bio_ref_interval || finding.reference_range || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Status</p>
                                  <div className="inline-block px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black rounded uppercase">
                                    {finding.interpretation || finding.abnormality_type || 'Abnormal'}
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-start gap-2">
                              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-800 font-medium">{finding}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                { }
                {analysisResults.clinical_suggestions && analysisResults.clinical_suggestions.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-5 h-5 text-primary-600" />
                      <h3 className="font-bold text-gray-900 text-lg">AI Clinical Recommendations ({analysisResults.clinical_suggestions.length})</h3>
                    </div>
                    <div className="space-y-3">
                      {(analysisResults.clinical_suggestions || []).map((s, index) => {
                        const suggestion = typeof s === 'object' && s !== null ? {
                          category: safeStr(s.category), suggestion: safeStr(s.suggestion || s.text),
                          confidence: parseFloat(s.confidence) || 0, priority: safeStr(s.priority), reasoning: safeStr(s.reasoning)
                        } : { category: '', suggestion: safeStr(s), confidence: 0, priority: '', reasoning: '' }
                        return (
                          <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${suggestion.category === 'MEDICATION' ? 'bg-purple-100 text-purple-800' :
                                suggestion.category === 'ALERT' ? 'bg-red-100 text-red-800' :
                                  suggestion.category === 'TEST' ? 'bg-primary-100 text-primary-800' :
                                    suggestion.category === 'MONITORING' ? 'bg-green-100 text-green-800' :
                                      suggestion.category === 'REFERRAL' ? 'bg-indigo-100 text-indigo-800' :
                                        suggestion.category === 'LIFESTYLE' ? 'bg-orange-100 text-orange-800' :
                                          suggestion.category === 'EDUCATION' ? 'bg-teal-100 text-teal-800' :
                                            'bg-gray-100 text-gray-800'
                                }`}>
                                {suggestion.category}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${suggestion.priority === 'CRITICAL' ? 'bg-red-500 text-white' :
                                suggestion.priority === 'HIGH' ? 'bg-orange-500 text-white' :
                                  suggestion.priority === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                                    'bg-gray-500 text-white'
                                }`}>
                                {suggestion.priority}
                              </span>
                              <span className="text-xs text-gray-600 ml-auto">
                                Confidence: <strong>{Math.round(suggestion.confidence * 100)}%</strong>
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 font-semibold mb-1">{suggestion.suggestion}</p>
                            <p className="text-xs text-gray-600 italic">{suggestion.reasoning}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                { }
                {analysisResults.summary && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 mb-6 font-medium">
                    <div className="flex items-center gap-2 mb-3">
                      <Clipboard className="w-5 h-5 text-gray-600" />
                      <h3 className="font-bold text-gray-900 text-lg">Analysis Summary</h3>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{analysisResults.summary}</p>
                  </div>
                )}

                { }
                {analysisResults.detailed_analysis && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200 mb-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-gray-900 text-lg">AI-Generated Analysis</h3>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{analysisResults.detailed_analysis}</p>
                    </div>
                  </div>
                )}

                { }
                {analysisResults.risk_assessment && Object.keys(analysisResults.risk_assessment).length > 0 && (
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-200 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <h3 className="font-bold text-gray-900 text-lg">Risk Assessment</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(analysisResults.risk_assessment).map(([key, value], index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-orange-100">
                          <p className="text-xs text-orange-600 font-bold mb-1 uppercase">{key.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-gray-800 font-medium">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                { }
                {analysisResults.red_flags && analysisResults.red_flags.length > 0 && (
                  <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-xl p-5 border-2 border-red-400 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-6 h-6 text-red-700 animate-pulse" />
                      <h3 className="font-bold text-red-900 text-lg">🚨 Critical Red Flags</h3>
                    </div>
                    <div className="space-y-2">
                      {analysisResults.red_flags.map((flag, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-white rounded-lg border-l-4 border-red-600">
                          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-900 font-semibold">{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                { }
                {analysisResults.positive_findings && analysisResults.positive_findings.length > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-gray-900 text-lg">✅ Positive Findings</h3>
                    </div>
                    <div className="space-y-2">
                      {analysisResults.positive_findings.map((finding, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-white rounded-lg border-l-4 border-green-500">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-800 font-medium">{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                { }
                {analysisResults.follow_up_recommendations && analysisResults.follow_up_recommendations.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-primary-600" />
                      <h3 className="font-bold text-gray-900 text-lg">Follow-up Plan</h3>
                    </div>
                    <div className="space-y-3">
                      {analysisResults.follow_up_recommendations.map((followup, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-gray-900">{followup.action}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${followup.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                              followup.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {followup.priority}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1"><strong>Timeframe:</strong> {followup.timeframe}</p>
                          <p className="text-xs text-gray-700">{followup.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                { }
                {analysisResults.lifestyle_recommendations && analysisResults.lifestyle_recommendations.length > 0 && (
                  <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-5 border border-teal-200 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Heart className="w-5 h-5 text-teal-600" />
                      <h3 className="font-bold text-gray-900 text-lg">Lifestyle Recommendations</h3>
                    </div>
                    <div className="space-y-3">
                      {analysisResults.lifestyle_recommendations.map((lifestyle, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-teal-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs font-bold">
                              {lifestyle.category}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">{lifestyle.recommendation}</p>
                          <p className="text-xs text-gray-600 mb-1"><strong>Why:</strong> {lifestyle.rationale}</p>
                          <p className="text-xs text-gray-700"><strong>How:</strong> {lifestyle.implementation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                { }
                {analysisResults.patient_education && analysisResults.patient_education.length > 0 && (
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-5 border border-yellow-200 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-bold text-gray-900 text-lg">Patient Education</h3>
                    </div>
                    <div className="space-y-3">
                      {analysisResults.patient_education.map((education, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-yellow-200">
                          <h4 className="font-bold text-gray-900 mb-2">📚 {education.topic}</h4>
                          <p className="text-sm text-gray-700 mb-2">{education.explanation}</p>
                          <p className="text-xs text-yellow-800 bg-yellow-50 p-2 rounded border border-yellow-200">
                            <strong>Why this matters:</strong> {education.importance}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                { }
                {analysisResults.doctor_notes && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-300 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Stethoscope className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-gray-900 text-lg">👨‍⚕️ Professional Clinical Notes</h3>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line font-mono">{analysisResults.doctor_notes}</p>
                    </div>
                  </div>
                )}

                { }
                {analysisResults.confidence_score && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-700">AI Analysis Confidence</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-48 h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                          <div
                            className={`h-full rounded-full transition-all ${analysisResults.confidence_score >= 0.8 ? 'bg-green-500' :
                              analysisResults.confidence_score >= 0.6 ? 'bg-blue-500' :
                                'bg-yellow-500'
                              }`}
                            style={{ width: `${analysisResults.confidence_score * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-gray-900 text-lg">{Math.round(analysisResults.confidence_score * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-6 border-t border-gray-200">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-gray-600">
                    💡 Scroll through the tabs above to see detailed analysis
                  </p>
                  <button
                    onClick={() => setShowAnalysisModal(false)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    View Full Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        { }
        <div className="hidden print:block print-footer">
          <p>Medical Report Analysis Platform | Confidential Medical Document</p>
          <p className="mt-1">⚕️ This AI analysis is for clinical decision support only. Final medical decisions must be made by licensed healthcare professionals.</p>
        </div>
      </div>
    </div>
  )
}
