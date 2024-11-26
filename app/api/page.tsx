"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FiClock, 
  FiCalendar, 
  FiMapPin, 
  FiUser, 
  FiDollarSign, 
  FiCreditCard, 
  FiSend, 
  FiGlobe, 
  FiMessageCircle,
  FiDatabase,
  FiAlertCircle 
} from 'react-icons/fi';

// Component imports
import WithdrawComponent from '../../components/WithdrawComponent';
import DepositComponent from '../../components/DepositComponent';
import TransferComponent from '../../components/TransferComponent';
import ForeignExchangeComponent from '../../components/ForeignExchangeComponent';
import CommentComponent from '../../components/CommentComponent';
import OtherBankTransferComponent from '../../components/OtherBankTransferComponent';
import BankFloorLayout from '../../components/BankFloorLayout';
import CustomerOnboarding from '../../components/CustomerOnboarding';
import BankProductsShowcase from '../../components/BankProduct';
import FlexcubeTest from '../../components/FlexcubeTest';
import ErrorMessage from '../../components/ErrorMessage';

// Type imports
import { AccountData } from '@/types/account';

const INACTIVITY_TIMEOUT = 150000;