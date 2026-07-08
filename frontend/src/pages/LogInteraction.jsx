import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHcps } from '../store/slices/hcpSlice';
import { createInteractionRecord, updateInteractionRecord } from '../store/slices/interactionSlice';
import { sendMessageToChat, clearChat, updateExtractionField } from '../store/slices/chatSlice';
import { useForm } from 'react-hook-form';
import {
  MessageSquare,
  FormInput,
  Send,
  Calendar,
  User,
  Building,
  GraduationCap,
  Briefcase,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LogInteraction = () => {
  const dispatch = useDispatch();
  const { hcps } = useSelector((state) => state.hcp);
  const { messages, extractionPreview, loading: chatLoading, success: chatSuccess, validationErrors } = useSelector((state) => state.chat);
  const { loading: interactionLoading } = useSelector((state) => state.interaction);

  const [activeTab, setActiveTab] = useState('structured'); // 'structured' or 'aichat'
  const [selectedHcpId, setSelectedHcpId] = useState('');
  
  // Staged chat record ID for modifications
  const [loggedChatInteractionId, setLoggedChatInteractionId] = useState(null);

  // Chat message textbox input
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    dispatch(fetchHcps());
  }, [dispatch]);

  useEffect(() => {
    // Scroll chat thread to bottom on message updates
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // --- TAB 1: STRUCTURED FORM CONTROLS ---
  const {
    register: registerForm,
    handleSubmit: handleFormSubmit,
    setValue: setFormValue,
    watch: watchForm,
    reset: resetForm,
    formState: { errors: formErrors }
  } = useForm({
    defaultValues: {
      meeting_date: new Date().toISOString().split('T')[0],
      meeting_type: 'Face-to-Face',
      products_discussed: [],
      priority: 'Medium',
      sentiment: 'Neutral',
      summary: '',
      doctor_feedback: '',
      next_action: '',
      follow_up_date: ''
    }
  });

  // Watch doctor selector to auto-fill hospital & specialty
  const watchedHcpId = watchForm('hcp_id');
  useEffect(() => {
    if (watchedHcpId) {
      const matched = hcps.find(h => h.id.toString() === watchedHcpId.toString());
      if (matched) {
        setFormValue('hospital', matched.hospital);
        setFormValue('specialization', matched.specialization);
      }
    } else {
      setFormValue('hospital', '');
      setFormValue('specialization', '');
    }
  }, [watchedHcpId, hcps, setFormValue]);

  const onStructuredSubmit = (data) => {
    // Convert hcp_id to int
    const payload = {
      ...data,
      hcp_id: parseInt(data.hcp_id),
      // If follow_up_date is blank, set null
      follow_up_date: data.follow_up_date || null
    };
    dispatch(createInteractionRecord(payload)).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        resetForm();
        setSelectedHcpId('');
      }
    });
  };

  // --- TAB 2: AI CHAT CONTROLS ---
  const handleSendChat = (e) => {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query) return;

    setChatInput('');
    // Dispatch conversational agent request
    dispatch(sendMessageToChat(query)).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        const payload = res.payload;
        if (payload.success && payload.interaction_id) {
          setLoggedChatInteractionId(payload.interaction_id);
        }
      }
    });
  };

  const handleUpdateExtractionField = (field, value) => {
    dispatch(updateExtractionField({ field, value }));
  };

  const handleConfirmAndSaveChat = () => {
    if (!loggedChatInteractionId) return;
    
    // The chat agent already logged the initial extraction draft to ensure tool execution.
    // If the representative edits/confirms the extraction, we call the PUT endpoint to commit updates!
    const data = {
      summary: extractionPreview.summary,
      doctor_feedback: extractionPreview.doctor_feedback,
      sentiment: extractionPreview.sentiment,
      priority: extractionPreview.priority,
      meeting_date: extractionPreview.meeting_date,
      meeting_type: extractionPreview.meeting_type,
      products_discussed: extractionPreview.products_discussed,
      next_action: extractionPreview.next_action,
      follow_up_date: extractionPreview.follow_up_date || null
    };

    dispatch(updateInteractionRecord({ id: loggedChatInteractionId, data })).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        // Clear AI extraction states on final confirmation
        dispatch(clearChat());
        setLoggedChatInteractionId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Log Medical Interaction</h2>
        <p className="text-xs text-slate-400">Record clinical discussions, product reviews, and upcoming appointments</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('structured')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'structured'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <FormInput className="w-4 h-4" />
          Structured Form
        </button>
        <button
          onClick={() => setActiveTab('aichat')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'aichat'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          AI Conversational Chat
          <span className="bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wide font-black">
            AI-First
          </span>
        </button>
      </div>

      {/* Content body */}
      <div>
        {activeTab === 'structured' ? (
          /* TAB 1: STRUCTURED FORM */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium p-6">
            <form onSubmit={handleFormSubmit(onStructuredSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Selector for HCP Doctor Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Doctor Name</label>
                  <select
                    {...registerForm('hcp_id', { required: 'Doctor Name is required.' })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100 cursor-pointer font-medium"
                  >
                    <option value="">Select Doctor Profile</option>
                    {hcps.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                  {formErrors.hcp_id && <span className="text-xs text-rose-500 font-semibold block mt-1.5">{formErrors.hcp_id.message}</span>}
                </div>

                {/* Read-Only Hospital (pre-populated) */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Affiliated Hospital</label>
                  <input
                    type="text"
                    disabled
                    {...registerForm('hospital')}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-500 focus:outline-none"
                    placeholder="Auto-filled from profile"
                  />
                </div>

                {/* Read-Only Specialization (pre-populated) */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Specialization</label>
                  <input
                    type="text"
                    disabled
                    {...registerForm('specialization')}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-500 focus:outline-none"
                    placeholder="Auto-filled from profile"
                  />
                </div>

                {/* Meeting Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Meeting Date</label>
                  <input
                    type="date"
                    {...registerForm('meeting_date', { required: 'Meeting Date is required.' })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100 font-semibold cursor-pointer"
                  />
                </div>

                {/* Meeting Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Meeting Type</label>
                  <select
                    {...registerForm('meeting_type', { required: 'Meeting Type is required.' })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100 cursor-pointer font-semibold"
                  >
                    <option value="Face-to-Face">Face-to-Face</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Phone">Phone</option>
                  </select>
                </div>

                {/* Follow Up Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Follow-up Date</label>
                  <input
                    type="date"
                    {...registerForm('follow_up_date')}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100 font-semibold cursor-pointer"
                  />
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                  <select
                    {...registerForm('priority')}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100 cursor-pointer font-semibold"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Sentiment Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sentiment</label>
                  <select
                    {...registerForm('sentiment')}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100 cursor-pointer font-semibold"
                  >
                    <option value="Positive">Positive</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Negative">Negative</option>
                  </select>
                </div>

              </div>

              {/* Products Discussed Checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Products Discussed</label>
                <div className="flex flex-wrap gap-4.5">
                  {['CardioX', 'NeuroSentry', 'DiabeCare', 'RespiClear', 'OncoShield'].map(prod => (
                    <label key={prod} className="flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 px-4 py-2 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                      <input
                        type="checkbox"
                        value={prod}
                        {...registerForm('products_discussed')}
                        className="rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500 w-4.5 h-4.5"
                      />
                      <span>{prod}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Summary / Meeting Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Meeting Notes / Discussion Summary</label>
                  <textarea
                    rows={4}
                    {...registerForm('summary')}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
                    placeholder="Enter discussion notes or clinic highlights..."
                  ></textarea>
                </div>

                {/* Doctor Feedback */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Doctor Feedback</label>
                  <textarea
                    rows={4}
                    {...registerForm('doctor_feedback')}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
                    placeholder="Enter direct feedback, skepticism, or requests..."
                  ></textarea>
                </div>

                {/* Next Action */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Next Best Action / Follow-up Notes</label>
                  <input
                    type="text"
                    {...registerForm('next_action')}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
                    placeholder="e.g. Email trial data, schedule follow up clinical lunch..."
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3.5 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl text-slate-500 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={interactionLoading}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-premium transition-all"
                >
                  {interactionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Interaction
                </button>
              </div>

            </form>
          </div>
        ) : (
          /* TAB 2: AI CONVERSATIONAL CHAT */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Chat Thread Console (Left - Col Span 3) */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium flex flex-col h-[580px] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 block animate-ping"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">OmniPharma Log Agent</span>
                </div>
                <button
                  onClick={() => dispatch(clearChat())}
                  className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset Chat
                </button>
              </div>

              {/* Messages viewport */}
              <div className="flex-grow p-5 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <Sparkles className="w-10 h-10 text-primary-500 animate-pulse mb-3" />
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Start Conversational Logging</h4>
                    <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
                      Simply type a description of your meeting. The AI will extract clinical details, products, sentiment, next steps, and log the interaction.
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-left text-xs text-slate-500 space-y-2 mt-5 w-full max-w-md">
                      <p className="font-bold text-slate-600 dark:text-slate-400">Example:</p>
                      <p className="italic">"I met Dr. Sarah Jenkins today at Metro General. We discussed CardioX. She was very positive. Let's send her clinical trial booklets next Friday."</p>
                    </div>
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-4.5 rounded-2xl text-sm leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-primary-600 text-white rounded-br-none shadow-premium'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-150 dark:border-slate-700'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-150 dark:border-slate-700 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                      <span className="text-xs font-semibold">AI is analyzing and extracting details...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef}></div>
              </div>

              {/* Chat Input Text Box */}
              <form onSubmit={handleSendChat} className="p-4 border-t border-slate-150 dark:border-slate-850 flex gap-2.5 bg-slate-50/50 dark:bg-slate-850/10">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  placeholder="Type visit highlights (e.g. I met Dr. Kumar today...)"
                  className="flex-grow px-4 py-2.5 text-sm rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 p-2.5 rounded-xl transition-all shadow-premium"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Extracted Structured Preview Panel (Right - Col Span 2) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium flex flex-col h-[580px] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-primary-600" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Structured Extraction Draft</span>
              </div>

              <div className="flex-grow p-5 overflow-y-auto space-y-4">
                {!extractionPreview ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                    <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-xs font-semibold">No active draft extraction.</p>
                    <p className="text-[10px] mt-0.5 max-w-[200px]">Send a conversation log to trigger entity parsing.</p>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs font-semibold">
                    
                    {/* Live Errors Warn */}
                    {validationErrors.length > 0 && (
                      <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl border border-rose-100 dark:border-rose-950/30 flex gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Missing Required Fields:</p>
                          <ul className="list-disc pl-4 mt-1 font-medium space-y-0.5">
                            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Editable Preview fields */}
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">Doctor Name</label>
                      <input
                        type="text"
                        value={extractionPreview.doctor_name || ''}
                        onChange={(e) => handleUpdateExtractionField('doctor_name', e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none dark:text-slate-100 text-xs font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">Hospital</label>
                        <input
                          type="text"
                          value={extractionPreview.hospital || ''}
                          onChange={(e) => handleUpdateExtractionField('hospital', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none dark:text-slate-100 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">Specialization</label>
                        <input
                          type="text"
                          value={extractionPreview.specialization || ''}
                          onChange={(e) => handleUpdateExtractionField('specialization', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none dark:text-slate-100 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">Meeting Date</label>
                        <input
                          type="date"
                          value={extractionPreview.meeting_date || ''}
                          onChange={(e) => handleUpdateExtractionField('meeting_date', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none dark:text-slate-100 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">Meeting Type</label>
                        <select
                          value={extractionPreview.meeting_type || 'Face-to-Face'}
                          onChange={(e) => handleUpdateExtractionField('meeting_type', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none dark:text-slate-100 text-xs font-bold"
                        >
                          <option value="Face-to-Face">Face-to-Face</option>
                          <option value="Virtual">Virtual</option>
                          <option value="Phone">Phone</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">Sentiment</label>
                        <select
                          value={extractionPreview.sentiment || 'Neutral'}
                          onChange={(e) => handleUpdateExtractionField('sentiment', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none dark:text-slate-100 text-xs font-bold"
                        >
                          <option value="Positive">Positive</option>
                          <option value="Neutral">Neutral</option>
                          <option value="Negative">Negative</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">Priority</label>
                        <select
                          value={extractionPreview.priority || 'Medium'}
                          onChange={(e) => handleUpdateExtractionField('priority', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none dark:text-slate-100 text-xs font-bold"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>

                    {/* Products discussed */}
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">Products Discussed</label>
                      <input
                        type="text"
                        value={extractionPreview.products_discussed ? extractionPreview.products_discussed.join(', ') : ''}
                        onChange={(e) => handleUpdateExtractionField('products_discussed', e.target.value.split(',').map(s=>s.trim()))}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none dark:text-slate-100 text-xs font-bold"
                        placeholder="e.g. CardioX, DiabeCare"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">Discussion Summary</label>
                      <textarea
                        rows={2}
                        value={extractionPreview.summary || ''}
                        onChange={(e) => handleUpdateExtractionField('summary', e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none dark:text-slate-100 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 mb-1">Doctor Feedback</label>
                      <textarea
                        rows={2}
                        value={extractionPreview.doctor_feedback || ''}
                        onChange={(e) => handleUpdateExtractionField('doctor_feedback', e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none dark:text-slate-100 text-xs font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">Next Action Item</label>
                        <input
                          type="text"
                          value={extractionPreview.next_action || ''}
                          onChange={(e) => handleUpdateExtractionField('next_action', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none dark:text-slate-100 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">Follow-up Date</label>
                        <input
                          type="date"
                          value={extractionPreview.follow_up_date || ''}
                          onChange={(e) => handleUpdateExtractionField('follow_up_date', e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none dark:text-slate-100 text-xs font-bold"
                        />
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Confirm / Commit Updates */}
              {extractionPreview && (
                <div className="p-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex justify-end">
                  <button
                    onClick={handleConfirmAndSaveChat}
                    disabled={interactionLoading}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-premium transition-all"
                  >
                    {interactionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Confirm & Save Record
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default LogInteraction;
