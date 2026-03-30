import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FlaskConical,
  ArrowLeft,
  Save,
  Send,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type {
  BookingTest,
  Result,
  TestMaster,
  TestParameter,
  Instrument,
  ApiResponse,
  PaginatedResponse,
} from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate, getStatusBadge } from '../../utils/formatters';

// ─── Types ──────────────────────────────────────────────

interface AssignedTestItem {
  id: string;
  bookingTestId: string;
  bookingId: string;
  sampleId: string;
  sampleCode: string;
  clientName: string;
  testId: string;
  testName: string;
  departmentId: string;
  departmentName: string;
  standardName?: string;
  priority: 'NORMAL' | 'URGENT' | 'CRITICAL';
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';
}

interface ParameterEntry {
  testParameterId: string;
  parameterName: string;
  method: string;
  unit: string;
  specification: string;
  minLimit: number | null;
  maxLimit: number | null;
  observedValue: string;
  passFail: 'PASS' | 'FAIL' | null;
}

type ViewMode = 'list' | 'entry';

const PRIORITY_BADGE_VARIANT: Record<string, 'blue' | 'orange' | 'red'> = {
  NORMAL: 'blue',
  URGENT: 'orange',
  CRITICAL: 'red',
};

const STATUS_BADGE_VARIANT: Record<string, 'yellow' | 'blue' | 'green' | 'emerald' | 'red' | 'gray'> = {
  PENDING: 'yellow',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  VERIFIED: 'emerald',
  REJECTED: 'red',
};

// ─── Helpers ────────────────────────────────────────────

function evaluatePassFail(
  observed: string,
  min: number | null,
  max: number | null,
): 'PASS' | 'FAIL' | null {
  if (!observed.trim()) return null;
  const numVal = parseFloat(observed);
  if (isNaN(numVal)) return null;
  if (min !== null && numVal < min) return 'FAIL';
  if (max !== null && numVal > max) return 'FAIL';
  if (min !== null || max !== null) return 'PASS';
  return null;
}

// ─── Component ──────────────────────────────────────────

export default function ResultEntryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Parse bookingTestId from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const urlBookingTestId = urlParams.get('bookingTestId');

  const [viewMode, setViewMode] = useState<ViewMode>(urlBookingTestId ? 'entry' : 'list');
  const [activeBookingTestId, setActiveBookingTestId] = useState<string | null>(
    urlBookingTestId,
  );
  const [parameters, setParameters] = useState<ParameterEntry[]>([]);
  const [instrumentId, setInstrumentId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [existingResultId, setExistingResultId] = useState<string | null>(null);

  // ─── Queries ────────────────────────────────────────

  // My assigned tests
  const {
    data: assignedData,
    isLoading: assignedLoading,
    isError: assignedError,
  } = useQuery({
    queryKey: ['my-assigned-tests', user?.departmentId],
    queryFn: () =>
      get<ApiResponse<AssignedTestItem[]>>(
        `/results/department/${user?.departmentId}`,
        { params: { assignedTo: user?.id } },
      ),
    enabled: viewMode === 'list' && !!user?.departmentId,
  });

  const assignedTests = assignedData?.data ?? [];

  // Current booking test result (for entry mode)
  const {
    data: resultData,
    isLoading: resultLoading,
  } = useQuery({
    queryKey: ['booking-test-result', activeBookingTestId],
    queryFn: () =>
      get<ApiResponse<Result>>(`/results/booking-test/${activeBookingTestId}`),
    enabled: viewMode === 'entry' && !!activeBookingTestId,
  });

  // Fetch the test master to get parameter definitions
  const activeTest = useMemo(() => {
    if (viewMode !== 'entry') return null;
    // Try to find from assigned list, or from result
    const fromList = assignedTests.find(
      (t) => (t.bookingTestId || t.id) === activeBookingTestId,
    );
    if (fromList) return fromList;
    // Construct from result data
    if (resultData?.data) {
      const r = resultData.data;
      return {
        id: r.bookingTestId,
        bookingTestId: r.bookingTestId,
        testId: '',
        testName: r.testName,
        sampleCode: r.sampleCode,
        sampleId: '',
        clientName: '',
        departmentId: r.departmentId,
        departmentName: r.departmentName,
        priority: 'NORMAL' as const,
        dueDate: '',
        status: r.status,
      } as AssignedTestItem;
    }
    return null;
  }, [viewMode, assignedTests, activeBookingTestId, resultData]);

  // Fetch test master parameters when we know the testId
  const testId = activeTest?.testId;
  const {
    data: testMasterData,
    isLoading: testMasterLoading,
  } = useQuery({
    queryKey: ['test-master', testId],
    queryFn: () => get<ApiResponse<TestMaster>>(`/test-masters/${testId}`),
    enabled: viewMode === 'entry' && !!testId,
  });

  // Fetch instruments for department
  const departmentId = activeTest?.departmentId || user?.departmentId;
  const { data: instrumentsData } = useQuery({
    queryKey: ['instruments', departmentId],
    queryFn: () =>
      get<PaginatedResponse<Instrument>>('/instruments', {
        params: { departmentId, limit: 200 },
      }),
    enabled: viewMode === 'entry' && !!departmentId,
  });

  const instruments = instrumentsData?.data ?? [];
  const instrumentOptions = instruments
    .filter((i) => i.isActive)
    .map((i) => ({
      value: i.id,
      label: `${i.code} - ${i.name}${i.model ? ` (${i.model})` : ''}`,
    }));

  // Initialize parameters from test master or existing result
  useEffect(() => {
    if (viewMode !== 'entry') return;

    // If there is an existing result, load its parameters
    const existingResult = resultData?.data;
    if (existingResult && existingResult.parameters?.length > 0) {
      setExistingResultId(existingResult.id);
      setRemarks(existingResult.remarks ?? '');

      const existingParams: ParameterEntry[] = existingResult.parameters.map((p) => {
        const observed = p.result ?? '';
        return {
          testParameterId: p.parameterId,
          parameterName: p.parameterName,
          method: p.method ?? '',
          unit: p.unit,
          specification: p.specification ?? '',
          minLimit: null,
          maxLimit: null,
          observedValue: observed,
          passFail: p.isCompliant === true ? 'PASS' : p.isCompliant === false ? 'FAIL' : null,
        };
      });

      // Merge with test master limits if available
      if (testMasterData?.data?.parameters) {
        const masterMap = new Map<string, TestParameter>();
        testMasterData.data.parameters.forEach((tp) => masterMap.set(tp.id, tp));
        existingParams.forEach((ep) => {
          const master = masterMap.get(ep.testParameterId);
          if (master) {
            ep.minLimit = master.minValue ?? null;
            ep.maxLimit = master.maxValue ?? null;
            ep.method = ep.method || master.method || '';
            ep.specification = ep.specification || master.specification || '';
          }
        });
      }

      setParameters(existingParams);
      return;
    }

    // If no existing result, populate from test master
    if (testMasterData?.data?.parameters) {
      const params: ParameterEntry[] = testMasterData.data.parameters
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((tp) => ({
          testParameterId: tp.id,
          parameterName: tp.name,
          method: tp.method ?? '',
          unit: tp.unit,
          specification: tp.specification ?? '',
          minLimit: tp.minValue ?? null,
          maxLimit: tp.maxValue ?? null,
          observedValue: '',
          passFail: null,
        }));
      setParameters(params);
      setExistingResultId(null);
      setRemarks('');
    }
  }, [viewMode, testMasterData, resultData]);

  // ─── Mutations ──────────────────────────────────────

  const createResultMutation = useMutation({
    mutationFn: (payload: {
      bookingTestId: string;
      sampleId: string;
      departmentId: string;
      instrumentId?: string;
      parameters: Array<{
        testParameterId: string;
        parameterName: string;
        method: string;
        unit: string;
        specification: string;
        minLimit: number | null;
        maxLimit: number | null;
        observedValue: string;
      }>;
      remarks: string;
      status?: string;
    }) => post<ApiResponse<Result>>('/results', payload),
    onSuccess: (_, variables) => {
      const isDraft = !variables.status || variables.status === 'IN_PROGRESS';
      toast.success(isDraft ? 'Result saved as draft' : 'Result submitted for review');
      queryClient.invalidateQueries({ queryKey: ['my-assigned-tests'] });
      queryClient.invalidateQueries({ queryKey: ['booking-test-result', activeBookingTestId] });
      if (!isDraft) {
        backToList();
      }
    },
    onError: () => toast.error('Failed to save result'),
  });

  const updateResultMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      instrumentId?: string;
      parameters: Array<{
        testParameterId: string;
        parameterName: string;
        method: string;
        unit: string;
        specification: string;
        minLimit: number | null;
        maxLimit: number | null;
        observedValue: string;
      }>;
      remarks: string;
      status?: string;
    }) => put<ApiResponse<Result>>(`/results/${payload.id}`, payload),
    onSuccess: (_, variables) => {
      const isDraft = !variables.status || variables.status === 'IN_PROGRESS';
      toast.success(isDraft ? 'Result saved as draft' : 'Result submitted for review');
      queryClient.invalidateQueries({ queryKey: ['my-assigned-tests'] });
      queryClient.invalidateQueries({ queryKey: ['booking-test-result', activeBookingTestId] });
      if (!isDraft) {
        backToList();
      }
    },
    onError: () => toast.error('Failed to update result'),
  });

  const isSaving = createResultMutation.isPending || updateResultMutation.isPending;

  // ─── Handlers ───────────────────────────────────────

  const openResultEntry = (item: AssignedTestItem) => {
    const btId = item.bookingTestId || item.id;
    setActiveBookingTestId(btId);
    setViewMode('entry');
    setParameters([]);
    setInstrumentId('');
    setRemarks('');
    setExistingResultId(null);
    // Update URL without full navigation
    window.history.pushState({}, '', `/analysis/results?bookingTestId=${btId}`);
  };

  const backToList = () => {
    setViewMode('list');
    setActiveBookingTestId(null);
    setParameters([]);
    setInstrumentId('');
    setRemarks('');
    setExistingResultId(null);
    window.history.pushState({}, '', '/analysis/results');
  };

  const updateObservedValue = useCallback(
    (index: number, value: string) => {
      setParameters((prev) => {
        const updated = [...prev];
        const param = { ...updated[index] };
        param.observedValue = value;
        param.passFail = evaluatePassFail(value, param.minLimit, param.maxLimit);
        updated[index] = param;
        return updated;
      });
    },
    [],
  );

  const buildPayload = (status?: string) => {
    const paramPayload = parameters.map((p) => ({
      testParameterId: p.testParameterId,
      parameterName: p.parameterName,
      method: p.method,
      unit: p.unit,
      specification: p.specification,
      minLimit: p.minLimit,
      maxLimit: p.maxLimit,
      observedValue: p.observedValue,
    }));

    return {
      bookingTestId: activeBookingTestId!,
      sampleId: activeTest?.sampleId ?? '',
      departmentId: activeTest?.departmentId ?? user?.departmentId ?? '',
      instrumentId: instrumentId || undefined,
      parameters: paramPayload,
      remarks,
      status,
    };
  };

  const handleSaveDraft = () => {
    if (existingResultId) {
      updateResultMutation.mutate({
        id: existingResultId,
        ...buildPayload('IN_PROGRESS'),
      });
    } else {
      createResultMutation.mutate(buildPayload('IN_PROGRESS'));
    }
  };

  const handleSubmit = () => {
    // Validate that all required parameters have values
    const emptyRequired = parameters.filter(
      (p) => !p.observedValue.trim(),
    );
    if (emptyRequired.length > 0) {
      toast.error(
        `Please enter observed values for all parameters. ${emptyRequired.length} parameter(s) are empty.`,
      );
      return;
    }

    if (existingResultId) {
      updateResultMutation.mutate({
        id: existingResultId,
        ...buildPayload('COMPLETED'),
      });
    } else {
      createResultMutation.mutate(buildPayload('COMPLETED'));
    }
  };

  // ─── Summary counts ────────────────────────────────

  const paramSummary = useMemo(() => {
    let pass = 0;
    let fail = 0;
    let pending = 0;
    parameters.forEach((p) => {
      if (p.passFail === 'PASS') pass++;
      else if (p.passFail === 'FAIL') fail++;
      else pending++;
    });
    return { pass, fail, pending, total: parameters.length };
  }, [parameters]);

  // ─── Render: My Assigned Tests (list mode) ─────────

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Result Entry</h1>
          <p className="text-sm text-gray-500 mt-1">View your assigned tests and enter results</p>
        </div>

        {assignedLoading ? (
          <Loader text="Loading assigned tests..." />
        ) : assignedError ? (
          <Card>
            <EmptyState
              icon={<AlertTriangle className="h-8 w-8 text-red-400" />}
              title="Failed to Load Tests"
              description="An error occurred while fetching your assigned tests."
              action={
                <Button
                  variant="outline"
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: ['my-assigned-tests'],
                    })
                  }
                >
                  Retry
                </Button>
              }
            />
          </Card>
        ) : assignedTests.length === 0 ? (
          <Card>
            <EmptyState
              icon={<ClipboardList className="h-8 w-8 text-gray-400" />}
              title="No Tests Assigned"
              description="You don't have any tests assigned to you at this time."
            />
          </Card>
        ) : (
          <Card noPadding>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Sample Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Test Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {assignedTests.map((item) => {
                    const isItemOverdue =
                      item.dueDate &&
                      new Date(item.dueDate) < new Date(new Date().toDateString()) &&
                      item.status !== 'COMPLETED' &&
                      item.status !== 'VERIFIED';
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors cursor-pointer ${
                          isItemOverdue
                            ? 'bg-red-50 hover:bg-red-100'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => openResultEntry(item)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-blue-600 whitespace-nowrap">
                          {item.sampleCode}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {item.testName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {item.clientName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={PRIORITY_BADGE_VARIANT[item.priority] ?? 'gray'}>
                            {item.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                          <span className={isItemOverdue ? 'text-red-600 font-medium' : ''}>
                            {formatDate(item.dueDate)}
                            {isItemOverdue && (
                              <span className="ml-1 text-xs text-red-500">(Overdue)</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={STATUS_BADGE_VARIANT[item.status] ?? 'gray'}>
                            {getStatusBadge(item.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            icon={<FlaskConical className="h-3.5 w-3.5" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openResultEntry(item);
                            }}
                          >
                            Enter Results
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ─── Render: Result Entry Form ─────────────────────

  const isEntryLoading = resultLoading || testMasterLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={backToList}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Enter Test Results</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Record observed values for each parameter
          </p>
        </div>
      </div>

      {isEntryLoading ? (
        <Loader text="Loading test parameters..." />
      ) : (
        <>
          {/* Test Info Header */}
          <Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-gray-500 uppercase font-medium">Test Name</span>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {activeTest?.testName ?? testMasterData?.data?.name ?? '---'}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase font-medium">Sample Code</span>
                <p className="text-sm font-semibold text-blue-600 mt-0.5">
                  {activeTest?.sampleCode ?? '---'}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase font-medium">Client</span>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {activeTest?.clientName ?? '---'}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase font-medium">Standard</span>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {activeTest?.standardName ?? testMasterData?.data?.standardName ?? '---'}
                </p>
              </div>
            </div>
          </Card>

          {/* Instrument Selection */}
          <Card>
            <div className="max-w-md">
              <Select
                label="Instrument"
                options={instrumentOptions}
                value={instrumentId}
                onChange={(e) => setInstrumentId(e.target.value)}
                placeholder="Select instrument (optional)"
              />
            </div>
          </Card>

          {/* Parameter Summary */}
          {parameters.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{paramSummary.total}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Parameters</p>
              </div>
              <div className="bg-white rounded-xl border border-green-200 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{paramSummary.pass}</p>
                <p className="text-xs text-gray-500 mt-0.5">Pass</p>
              </div>
              <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{paramSummary.fail}</p>
                <p className="text-xs text-gray-500 mt-0.5">Fail</p>
              </div>
              <div className="bg-white rounded-xl border border-yellow-200 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{paramSummary.pending}</p>
                <p className="text-xs text-gray-500 mt-0.5">Pending Entry</p>
              </div>
            </div>
          )}

          {/* Parameters Table */}
          <Card title="Test Parameters" noPadding>
            {parameters.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<ClipboardList className="h-8 w-8 text-gray-400" />}
                  title="No Parameters Found"
                  description="No test parameters are configured for this test. Please check the test master configuration."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Parameter Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Specification
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Min Limit
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Max Limit
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">
                        Observed Value
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {parameters.map((param, idx) => (
                      <tr
                        key={param.testParameterId}
                        className={
                          param.passFail === 'PASS'
                            ? 'bg-green-50'
                            : param.passFail === 'FAIL'
                              ? 'bg-red-50'
                              : ''
                        }
                      >
                        <td className="px-4 py-3 text-sm text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {param.parameterName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {param.method || '---'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {param.unit || '---'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {param.specification || '---'}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 whitespace-nowrap">
                          {param.minLimit !== null ? param.minLimit : '---'}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 whitespace-nowrap">
                          {param.maxLimit !== null ? param.maxLimit : '---'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <input
                            type="text"
                            value={param.observedValue}
                            onChange={(e) => updateObservedValue(idx, e.target.value)}
                            className={`block w-full rounded-lg border px-3 py-1.5 text-sm text-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              param.passFail === 'PASS'
                                ? 'border-green-300 bg-green-50'
                                : param.passFail === 'FAIL'
                                  ? 'border-red-300 bg-red-50'
                                  : 'border-gray-300 bg-white'
                            }`}
                            placeholder="Enter value"
                          />
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {param.passFail === 'PASS' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                              <CheckCircle2 className="h-4 w-4" />
                              PASS
                            </span>
                          ) : param.passFail === 'FAIL' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                              <XCircle className="h-4 w-4" />
                              FAIL
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">---</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Remarks */}
          <Card>
            <div>
              <label
                htmlFor="result-remarks"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Remarks
              </label>
              <textarea
                id="result-remarks"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any remarks or observations about the test results..."
              />
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="text-sm text-gray-500">
              {paramSummary.pending > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  {paramSummary.pending} parameter(s) pending entry
                </span>
              )}
              {paramSummary.fail > 0 && (
                <span className="flex items-center gap-1.5 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  {paramSummary.fail} parameter(s) failed
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={backToList} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                icon={<Save className="h-4 w-4" />}
                onClick={handleSaveDraft}
                loading={isSaving}
              >
                Save as Draft
              </Button>
              <Button
                icon={<Send className="h-4 w-4" />}
                onClick={handleSubmit}
                loading={isSaving}
                disabled={parameters.length === 0}
              >
                Submit for Review
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
