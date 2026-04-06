"use client";
import React, { useState } from "react";
import {
  Search,
  ChevronDown,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Users,
  CreditCard,
  BookOpen,
  Shield,
  BarChart3,
  Settings,
  User,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Question {
  text: string;
  answer?: string;
}

interface Topic {
  id: number;
  icon: React.ReactNode;
  title: string;
  questions: string[];
}

interface SupportTicketForm {
  subject: string;
  description: string;
  attachments: File[];
}

interface AdminData {
  name: string;
  email: string;
  organization: string;
}

export default function OrgSupport() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState<boolean>(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState<boolean>(false);
  const [ticketForm, setTicketForm] = useState<SupportTicketForm>({
    subject: "",
    description: "",
    attachments: [],
  });
  const [formErrors, setFormErrors] = useState<{
    subject?: string;
    description?: string;
  }>({});

  // Mock admin data - in real app, this would come from auth/context
  const adminData: AdminData = {
    name: "John Doe",
    email: "john.doe@company.com",
    organization: "Acme University",
  };

  const topics: Topic[] = [
    {
      id: 1,
      icon: <Users className="w-5 h-5" />,
      title: "Managing Students & Seats",
      questions: [
        "How do I add students to my organization?",
        "How do I remove a student and free up a seat?",
        "What happens when I run out of seats?",
        "Can I reassign a seat from one student to another?",
        "How do I bulk upload students?",
        "Can students share accounts?",
      ],
    },
    {
      id: 2,
      icon: <CreditCard className="w-5 h-5" />,
      title: "Billing & Seat Management",
      questions: [
        "How do I purchase additional seats?",
        "How am I billed for seats?",
        "What happens if I reduce my seat count?",
        "How do I view my billing history and invoices?",
        "Can I change my billing cycle (monthly to annual)?",
        "Who can access billing information?",
      ],
    },

    {
      id: 4,
      icon: <User className="w-5 h-5" />,
      title: "User Roles & Permissions",
      questions: [
        "What user roles are available?",
        "How do I add another admin to my organization?",
        "Can admins see all student data?",
        "How do I remove an admin's access?",
      ],
    },
    {
      id: 5,
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Reports & Analytics",
      questions: [
        "What reports are available?",
        "How do I export data for our internal systems?",
        "Can I see which students are inactive?",
        "How do I measure ROI on our learning investment?",
      ],
    },

    {
      id: 7,
      icon: <Shield className="w-5 h-5" />,
      title: "Security & Compliance",
      questions: [
        "How is student data protected?",
        "Can students access data after leaving our organization?",
        "How do I export all our organization's data?",
        "Are we FERPA/GDPR compliant using your platform?",
      ],
    },
  ];

  const toggleTopic = (topicId: number) => {
    setExpandedTopic(expandedTopic === topicId ? null : topicId);
    setExpandedQuestion(null);
  };

  const toggleQuestion = (questionIndex: string) => {
    setExpandedQuestion(
      expandedQuestion === questionIndex ? null : questionIndex
    );
  };

  const filteredTopics = topics
    .map((topic) => ({
      ...topic,
      questions: topic.questions.filter((q) =>
        q.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((topic) => topic.questions.length > 0);

  const handleTicketSubmit = async () => {
    // Validate form
    const errors: { subject?: string; description?: string } = {};
    if (!ticketForm.subject.trim()) {
      errors.subject = "Subject is required";
    }
    if (!ticketForm.description.trim()) {
      errors.description = "Description is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmittingTicket(true);
    setFormErrors({});

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Reset form and close modal
      setTicketForm({ subject: "", description: "", attachments: [] });
      setIsTicketModalOpen(false);

      // In real app, show success toast
      console.log("Ticket submitted successfully!");
    } catch (error) {
      console.error("Failed to submit ticket:", error);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter((file) => file.size <= maxSize);

    setTicketForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles].slice(0, 5), // Max 5 files
    }));
  };

  const removeFile = (index: number) => {
    setTicketForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="min-h-screen ">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search FAQs or help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border dark:border-gray-600 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </motion.div>

        {/* Contact Info - Always Visible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-background   rounded-lg p-6 mb-8 shadow-sm"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 ">
            <div className="p-2 bg-accent rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            Need Help Now?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-accent rounded-lg flex-shrink-0">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Email Support
                </p>
                <a
                  href="mailto:contact@alle-ai.com"
                  className="text-muted-foreground font-medium hover:text-gray-400 transition-colors duration-200"
                >
                  contact@alle-ai.com
                </a>
                <p className="text-xs text-muted-foreground mt-1">
                  Respond within 24 hours
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-accent rounded-lg flex-shrink-0">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Phone Support
                </p>
                <a
                  href="tel:+233240827610"
                  className="text-muted-foreground font-medium hover:text-blue-600 transition-colors duration-200"
                >
                 +233240827610
                </a>
                <p className="text-xs text-muted-foreground mt-1">
                  Mon-Fri, 9AM-6PM EST
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-6 border-t dark:border-gray-500 border-gray-100">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsTicketModalOpen(true)}
              className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Submit a Ticket</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Live Chat</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Help Topics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-background  rounded-lg shadow-sm"
        >
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold ">Help Topics</h2>
          </div>

          <div className="divide-y">
            {filteredTopics.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
              >
                {/* Topic Header */}
                <button
                  onClick={() => toggleTopic(topic.id)}
                  className="w-full px-6 py-4 flex items-center justify-between dark:hover:bg-accent hover:bg-gray-50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-600 bg-accent">{topic.icon}</div>
                    <span className="font-medium ">{topic.title}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedTopic === topic.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-background"
                  >
                    <ChevronDown className="w-5 h-5 " />
                  </motion.div>
                </button>

                {/* Questions List */}
                <AnimatePresence>
                  {expandedTopic === topic.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="bg-background px-6 py-2">
                        {topic.questions.map((question, qIndex) => (
                          <div key={qIndex} className="border-b  last:border-0">
                            {/* Question */}
                            <button
                              onClick={() =>
                                toggleQuestion(`${topic.id}-${qIndex}`)
                              }
                              className="w-full py-3 flex items-start justify-between text-left  transition group"
                            >
                              <span className="text-sm font-medium  group-hover:text-gray-accent pr-4">
                                {question}
                              </span>
                              <motion.div
                                animate={{
                                  rotate:
                                    expandedQuestion === `${topic.id}-${qIndex}`
                                      ? 180
                                      : 0,
                                }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              </motion.div>
                            </button>

                            {/* Answer Placeholder */}
                            <AnimatePresence>
                              {expandedQuestion === `${topic.id}-${qIndex}` && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.2,
                                    ease: "easeInOut",
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="pb-4 pl-4">
                                    <motion.div
                                      initial={{ x: -10 }}
                                      animate={{ x: 0 }}
                                      className=" rounded-lg p-4 border-l-4 border-blue-500"
                                    >
                                      <p className="text-sm text-muted-foreground italic">
                                        Answer will be added later...
                                      </p>
                                    </motion.div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {filteredTopics.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center"
            >
              <p className="text-gray-500">
                No results found for "{searchQuery}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try different keywords or contact support
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          <p>
            {`Can't find what you're looking for? Our support team is here to
            help!`}
          </p>
        </motion.div>
      </div>

      {/* Support Ticket Modal */}
      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              Submit Support Ticket
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-6">
              {/* Auto-filled Admin Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="">Name:</span>
                    <span className="ml-2 font-medium">{adminData.name}</span>
                  </div>
                  <div>
                    <span className="">Email:</span>
                    <span className="ml-2 font-medium">{adminData.email}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="">Organization:</span>
                    <span className="ml-2 font-medium">
                      {adminData.organization}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subject Field */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="What do you need help with?"
                  value={ticketForm.subject}
                  onChange={(e) => {
                    setTicketForm((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }));
                    if (formErrors.subject) {
                      setFormErrors((prev) => ({
                        ...prev,
                        subject: undefined,
                      }));
                    }
                  }}
                  className={`${
                    formErrors.subject
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                />
                {formErrors.subject && (
                  <p className="text-sm text-red-500">{formErrors.subject}</p>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Tell us more about your issue..."
                  rows={5}
                  value={ticketForm.description}
                  onChange={(e) => {
                    setTicketForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }));
                    if (formErrors.description) {
                      setFormErrors((prev) => ({
                        ...prev,
                        description: undefined,
                      }));
                    }
                  }}
                  className={`${
                    formErrors.description
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  } resize-none`}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-500">
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Attachments <span className="text-gray-400">(optional)</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.pdf,.txt,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload files
                      </p>
                      <p className="text-xs text-gray-500">
                        Screenshots, documents, etc. (Max 10MB each, 5 files
                        total)
                      </p>
                    </div>
                  </label>
                </div>

                {/* Uploaded Files */}
                {ticketForm.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Uploaded Files:
                    </p>
                    <div className="space-y-1">
                      {ticketForm.attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm truncate">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(1)}MB)
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsTicketModalOpen(false);
                setTicketForm({
                  subject: "",
                  description: "",
                  attachments: [],
                });
                setFormErrors({});
              }}
              disabled={isSubmittingTicket}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTicketSubmit}
              disabled={isSubmittingTicket}
              className="min-w-[100px]"
            >
              {isSubmittingTicket ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Ticket"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
