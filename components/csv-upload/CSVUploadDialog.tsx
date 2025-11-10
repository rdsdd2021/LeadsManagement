'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react'
// CSV parsing components removed - using simple upload
import { useAuth } from '@/contexts/AuthContext'

interface CSVUploadDialogProps {
  open