import React, { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  Tag,
  Tabs,
  Button,
  Descriptions,
  Table,
  message,
  Alert,
  Spin,
} from 'antd';
import { CopyOutlined, ClockCircleOutlined, ApiOutlined, CodeOutlined } from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { formatBody } from '../utility/utility';
import { RequestsProps } from '../types/GeneralTypes';
import useEntryDetails from '../hooks/useEntryDetails';
import ExceptionDetailComponent from '../components/ExceptionDetailComponent';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ExceptionDetails: React.FC<RequestsProps> = ({ socket }) => {
  const { id } = useParams<{ id: string }>();
  const { entry: exception, loading, error } = useEntryDetails(socket, id!);

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" />;
  }

  if (!exception) {
    return <Alert message="Exception not found" type="warning" />;
  }

  return <ExceptionDetailComponent exception={exception} />;
};

export default ExceptionDetails;
