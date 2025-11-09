'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react'
import { CSVParser } from './CSVParser'
import { FieldMapper } from './FieldMapper'
import { ImportPreview } from './ImportPreview'
import { useAuth } from '@/contexts/AuthContext'

interface CSVUploadDialogProps {
  open