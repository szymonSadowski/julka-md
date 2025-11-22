"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useAction } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileText,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import {
  extractTextFromPdf,
  isPdfFile,
  type PdfExtractionResult,
} from "@/lib/pdfUtils";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

export default function FilesPage() {
  const { user } = useUser();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfExtraction, setPdfExtraction] = useState<{
    isExtracting: boolean;
    result: PdfExtractionResult | null;
    error: string | null;
  }>({
    isExtracting: false,
    result: null,
    error: null,
  });

  // Convex mutations and queries
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFileMetadata = useMutation(api.files.saveFileMetadata);
  const insertDocuments = useAction(api.rag.insertDocuments);
  const deleteUserFileWithRag = useAction(api.files.deleteUserFileWithRag);
  const files = useQuery(
    api.files.listUserFiles,
    user?.id ? { ownerId: user.id } : "skip"
  );

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);

    // Reset PDF extraction state
    setPdfExtraction({
      isExtracting: false,
      result: null,
      error: null,
    });

    // If it's a PDF, extract text
    if (isPdfFile(file)) {
      setPdfExtraction((prev) => ({ ...prev, isExtracting: true }));

      try {
        const extractionResult = await extractTextFromPdf(file);
        setPdfExtraction({
          isExtracting: false,
          result: extractionResult,
          error: null,
        });
      } catch (error) {
        console.error("PDF extraction failed:", error);
        setPdfExtraction({
          isExtracting: false,
          result: null,
          error:
            error instanceof Error
              ? error.message
              : "Failed to extract PDF text",
        });
      }
    }
  }, []);

  const handleFileClear = useCallback(() => {
    setSelectedFile(null);
    setPdfExtraction({
      isExtracting: false,
      result: null,
      error: null,
    });
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile || !user?.id) return;

    setIsProcessing(true);
    try {
      let text: string;

      // Use extracted text for PDFs if available, otherwise read as text
      const pdfResult = pdfExtraction.result;
      const shouldUseExtractedText =
        selectedFile &&
        isPdfFile(selectedFile) &&
        pdfResult &&
        !pdfExtraction.error;

      if (shouldUseExtractedText) {
        text = pdfResult!.text;
      } else {
        text = await selectedFile.text();
      }

      // Upload to Convex storage
      const uploadUrl = await generateUploadUrl();

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      const { storageId } = await result.json();

      // Insert document into RAG and get entry ID
      const hash = `${selectedFile.name}-${Date.now()}`; // Simple hash for deduplication
      const slug = `file-${storageId}`;
      const ragResult = await insertDocuments({
        content: text,
        slug: slug,
        title: selectedFile.name,
        hash: hash,
      });

      // Save file metadata with RAG entry ID
      await saveFileMetadata({
        ownerId: user.id,
        fileName: selectedFile.name,
        storageId: storageId as Id<"_storage">,
        ragEntryIds: [ragResult.entryId.toString()],
      });

      alert(
        `File uploaded and indexed successfully! Check console for content. File has ${text.length} characters.`
      );

      // Clear selection
      handleFileClear();
    } catch (error) {
      console.error("Processing failed:", error);
      alert("Failed to process file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteFile = async (fileId: Id<"files">) => {
    if (!user?.id) return;

    if (
      !confirm(
        "Are you sure you want to delete this file? This will also remove it from the knowledge base."
      )
    ) {
      return;
    }

    try {
      await deleteUserFileWithRag({ fileId, ownerId: user.id });
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete file. Please try again.");
    }
  };

  if (!user) {
    return (
      <main className="flex-1 w-full max-w-4xl mx-auto py-10 px-6">
        <p className="text-neutral-400">Please sign in to upload files.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto py-10 px-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-400 hover:text-white hover:bg-neutral-800 p-4 border border-neutral-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-semibold text-white mb-2">File Upload</h1>
        <p className="text-sm text-neutral-400">
          Upload a PDF or text file to see its content in the console
        </p>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Area */}
          <div className="relative">
            {!selectedFile ? (
              <>
                <input
                  type="file"
                  id="file-input"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <label
                  htmlFor="file-input"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                    isProcessing
                      ? "border-neutral-700 bg-neutral-800/50 cursor-not-allowed"
                      : "border-neutral-700 bg-neutral-800/30 hover:bg-neutral-800/50 hover:border-neutral-600"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-4 pb-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 text-black" />
                    </div>
                    <p className="text-sm font-medium text-neutral-300">
                      <span className="text-white font-semibold">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      PDF, TXT, or MD files
                    </p>
                  </div>
                </label>
              </>
            ) : (
              <div className="p-4 bg-neutral-800/50 rounded-xl border-2 border-neutral-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">
                            {selectedFile.name}
                          </p>
                          {isPdfFile(selectedFile) && (
                            <span className="text-xs text-white bg-red-500 px-2 py-0.5 rounded-full font-medium">
                              PDF
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>

                    {/* PDF Extraction Status */}
                    {isPdfFile(selectedFile) && (
                      <div className="mt-3 p-3 bg-neutral-900/60 rounded-lg">
                        {pdfExtraction.isExtracting && (
                          <div className="flex items-center text-sm text-blue-400">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            <span className="font-medium">
                              Extracting text from PDF...
                            </span>
                          </div>
                        )}

                        {pdfExtraction.result && !pdfExtraction.error && (
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-green-400">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              <span className="font-medium">
                                Text extracted successfully
                              </span>
                            </div>
                            <div className="text-xs text-neutral-400 bg-black/30 p-2 rounded">
                              <div>📄 {pdfExtraction.result.pages} pages</div>
                              <div>
                                📝{" "}
                                {pdfExtraction.result.text.length.toLocaleString()}{" "}
                                characters
                              </div>
                              {pdfExtraction.result.title && (
                                <div className="mt-1 text-neutral-300">
                                  <span className="font-medium">Title:</span>{" "}
                                  {pdfExtraction.result.title}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {pdfExtraction.error && (
                          <div className="flex items-center text-sm text-red-400">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            <span className="font-medium">
                              {pdfExtraction.error}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleFileClear}
                    disabled={isProcessing || pdfExtraction.isExtracting}
                    variant="ghost"
                    size="sm"
                    className="ml-3 text-neutral-400 hover:text-red-400 hover:bg-red-950/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleProcess}
            disabled={
              !selectedFile || isProcessing || pdfExtraction.isExtracting
            }
            className="w-full bg-white text-black hover:bg-neutral-200"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : pdfExtraction.isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing PDF...
              </>
            ) : selectedFile &&
              isPdfFile(selectedFile) &&
              pdfExtraction.result ? (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Process and Upload File
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Process and Upload File
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      <div className="h-8" />
      {/* Uploaded Files List */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!files ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400 text-sm">
                No files uploaded yet. Upload your first file to get started!
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file._id}
                    className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg border border-neutral-700 hover:bg-neutral-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-black" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {file.fileName}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Uploaded{" "}
                          {new Date(file.uploadedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDeleteFile(file._id)}
                      variant="ghost"
                      size="sm"
                      className="text-neutral-400 hover:text-red-400 hover:bg-red-950/20 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
