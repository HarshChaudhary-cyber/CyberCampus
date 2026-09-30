import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Mail, FileText, AlertCircle, Paperclip,
  MessageSquare, Building2, UserCheck, ShieldAlert,
  Inbox, ExternalLink, ShieldCheck, ChevronDown, ChevronUp, Activity, Network, Search,
  HardDrive, File, Trash2, Globe, Image as ImageIcon, CheckCircle2, Copy, Check,
  KeyRound, Eye, EyeOff, Smartphone, Bell,
} from 'lucide-react';
import { useCyberStore } from '../store';
import { getChallenge, getRoom } from '../challenges';
import { buildStepResponses } from '../challenges/evaluator';
import { HintDrawer } from '../components/ui/HintDrawer';
import { Button } from '../components/ui/Button';
import { NotFoundPage } from './NotFoundPage';
import type { EvidenceItem, Step, StepResponse } from '../types';
import type { FileSystemContent } from '../challenges/data/cc-df-01';
import type { BrowserHistoryContent, ProxyLogContent } from '../challenges/data/cc-df-02';
import type { StegoEvidenceContent } from '../challenges/data/cc-df-03';
import type { PasswordAuditContent } from '../challenges/data/cc-pr-01';
import type { AuthTimelineContent, PushSimulatorContent } from '../challenges/data/cc-pr-02';
import { extractLSBFromPngBytes, type StegoExtractionResult } from '../challenges/data/stego-fixtures';
import styles from './ChallengePage.module.css';

// ── Evidence Viewers ──────────────────────────────────────────────────────────

type InboxEmailItem = {
  id: string;
  sender_display: string;
  sender_address: string;
  to: string;
  date: string;
  subject: string;
  preview: string;
  category?: string;
  body: string;
  link?: {
    displayedText: string;
    actualDestination: string;
  };
  headers?: {
    returnPath: string;
    receivedFrom: string;
    spf: string;
    dkim: string;
    dmarc: string;
    isExternal: boolean;
  };
};

type InboxContent = {
  isInbox: boolean;
  inboxOwner: string;
  emails: InboxEmailItem[];
};

const InboxViewer: React.FC<{ content: InboxContent }> = ({ content }) => {
  const [activeEmailId, setActiveEmailId] = useState<string>(
    content.emails[0]?.id ?? ''
  );
  const [showHeaders, setShowHeaders] = useState<boolean>(false);

  const activeEmail =
    content.emails.find((e) => e.id === activeEmailId) ?? content.emails[0];

  return (
    <div className={styles.inboxViewer} role="region" aria-label="Simulated Mail Inbox">
      {/* Top bar */}
      <div className={styles.inboxHeader}>
        <div className={styles.inboxHeaderLeft}>
          <Inbox size={20} className={styles.inboxIcon} aria-hidden="true" />
          <div>
            <h3 className={styles.inboxTitle}>Corporate Webmail</h3>
            <p className={styles.inboxOwner}>{content.inboxOwner}</p>
          </div>
        </div>
        <span className={styles.inboxCountBadge}>{content.emails.length} Messages</span>
      </div>

      <div className={styles.inboxLayout}>
        {/* Navigation list */}
        <div className={styles.inboxNav} role="tablist" aria-label="Inbox message list">
          {content.emails.map((email) => {
            const isSelected = email.id === activeEmail?.id;
            return (
              <button
                key={email.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                tabIndex={0}
                className={`${styles.inboxNavItem} ${isSelected ? styles['inboxNavItem--active'] : ''}`}
                onClick={() => {
                  setActiveEmailId(email.id);
                  setShowHeaders(false);
                }}
              >
                <div className={styles.inboxNavTop}>
                  <span className={styles.inboxNavSender}>{email.sender_display}</span>
                  {email.category && (
                    <span className={styles.inboxNavCategory}>{email.category}</span>
                  )}
                </div>
                <div className={styles.inboxNavSubject}>{email.subject}</div>
                <div className={styles.inboxNavPreview}>{email.preview}</div>
                <div className={styles.inboxNavDate}>{email.date}</div>
              </button>
            );
          })}
        </div>

        {/* Message View Pane */}
        {activeEmail && (
          <div className={styles.inboxMessagePane} role="tabpanel" aria-label={`Message: ${activeEmail.subject}`}>
            <div className={styles.inboxMessageHeader}>
              <h4 className={styles.inboxMessageSubject}>{activeEmail.subject}</h4>
              <div className={styles.inboxMessageMeta}>
                <div className={styles.inboxMetaRow}>
                  <span className={styles.inboxMetaKey}>From:</span>
                  <span className={styles.inboxMetaVal}>
                    <strong>{activeEmail.sender_display}</strong> &lt;{activeEmail.sender_address}&gt;
                  </span>
                </div>
                <div className={styles.inboxMetaRow}>
                  <span className={styles.inboxMetaKey}>To:</span>
                  <span className={styles.inboxMetaVal}>{activeEmail.to}</span>
                </div>
                <div className={styles.inboxMetaRow}>
                  <span className={styles.inboxMetaKey}>Date:</span>
                  <span className={styles.inboxMetaVal}>{activeEmail.date}</span>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className={styles.inboxMessageBody}>{activeEmail.body}</div>

            {/* Neutral Link Inspector if email contains a link */}
            {activeEmail.link && (
              <div className={styles.inboxLinkCard} role="region" aria-label="Link destination inspection">
                <div className={styles.inboxLinkHeader}>
                  <ExternalLink size={16} aria-hidden="true" />
                  <span>Link Destination Inspector</span>
                </div>
                <div className={styles.inboxLinkGrid}>
                  <div className={styles.inboxLinkRow}>
                    <span className={styles.inboxLinkLabel}>Displayed Text:</span>
                    <span className={styles.inboxLinkValue}>{activeEmail.link.displayedText}</span>
                  </div>
                  <div className={styles.inboxLinkRow}>
                    <span className={styles.inboxLinkLabel}>Actual Destination:</span>
                    <span className={styles.inboxLinkValue}>{activeEmail.link.actualDestination}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Message Headers toggle */}
            {activeEmail.headers && (
              <div className={styles.inboxHeadersWrapper}>
                <button
                  type="button"
                  className={styles.inboxHeadersToggle}
                  onClick={() => setShowHeaders((prev) => !prev)}
                  aria-expanded={showHeaders}
                >
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>Message Headers & Authentication</span>
                  {showHeaders ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showHeaders && (
                  <div className={styles.inboxHeadersContent} role="region" aria-label="Header Details">
                    <table className={styles.inboxHeadersTable}>
                      <tbody>
                        <tr>
                          <th>Return-Path:</th>
                          <td>{activeEmail.headers.returnPath}</td>
                        </tr>
                        <tr>
                          <th>Received: from:</th>
                          <td>{activeEmail.headers.receivedFrom}</td>
                        </tr>
                        <tr>
                          <th>SPF:</th>
                          <td>{activeEmail.headers.spf}</td>
                        </tr>
                        <tr>
                          <th>DKIM:</th>
                          <td>{activeEmail.headers.dkim}</td>
                        </tr>
                        <tr>
                          <th>DMARC:</th>
                          <td>{activeEmail.headers.dmarc}</td>
                        </tr>
                        <tr>
                          <th>External Sender:</th>
                          <td>{activeEmail.headers.isExternal ? 'TRUE' : 'FALSE'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

type EmailContent = {
  from_display: string;
  from_address: string;
  reply_to?: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  link_display?: string;
  link_actual?: string;
  attachment?: string;
};

type ThreadMessage = {
  id: string;
  from_display: string;
  from_address: string;
  reply_to?: string;
  to: string;
  date: string;
  subject: string;
  body: string;
};

type ThreadContent = {
  isThread?: boolean;
  subject: string;
  messages: ThreadMessage[];
};

type DirectoryContent = {
  type: 'directory';
  company: string;
  employee: {
    name: string;
    title: string;
    department: string;
    officialEmail: string;
    internalPhone: string;
    officeLocation: string;
    assistant: string;
    currentStatus: string;
  };
  policy: {
    code: string;
    title: string;
    rules: string[];
  };
};

const EmailViewer: React.FC<{ content: EmailContent }> = ({ content }) => {
  return (
    <div className={styles.emailViewer}>
      <div className={styles.emailHeader}>
        {[
          { field: 'From',     value: `${content.from_display} <${content.from_address}>` },
          { field: 'Reply-To', value: content.reply_to },
          { field: 'To',       value: content.to },
          { field: 'Subject',  value: content.subject },
          { field: 'Date',     value: content.date },
        ].filter(({ value }) => Boolean(value)).map(({ field, value }) => (
          <div key={field} className={styles.emailRow}>
            <span className={styles.emailField}>{field}:</span>
            <span className={styles.emailValue}>{value}</span>
          </div>
        ))}
      </div>

      <div className={styles.emailBody} role="region" aria-label="Email body">
        {content.body}
      </div>

      {/* Link inspector */}
      {content.link_display && (
        <div className={styles.linkInspect} role="region" aria-label="Link inspection">
          <p className={styles.linkInspectLabel}>🔍 Link Inspection</p>
          <div className={styles.linkRow}>
            <span className={styles.linkRowLabel}>Displayed:</span>
            <span className={styles.linkRowDisplay}>{content.link_display}</span>
          </div>
          <div className={styles.linkRow}>
            <span className={styles.linkRowLabel}>Actual URL:</span>
            <span className={styles.linkRowDisplay}>{content.link_actual}</span>
          </div>
        </div>
      )}

      {/* Attachment */}
      {content.attachment && (
        <div className={styles.attachmentRow} role="region" aria-label="Attachment">
          <Paperclip size={16} className={styles.attachIcon} aria-hidden="true" />
          <span className={styles.attachName}>{content.attachment}</span>
        </div>
      )}
    </div>
  );
};

const EmailThreadViewer: React.FC<{ content: ThreadContent }> = ({ content }) => {
  return (
    <div className={styles.threadViewer} role="region" aria-label="Email conversation thread">
      <div className={styles.threadSubjectBar}>
        <span className={styles.threadSubjectLabel}>Thread:</span>
        <span className={styles.threadSubjectText}>{content.subject}</span>
        <span className={styles.threadCountBadge}>{content.messages.length} messages</span>
      </div>

      <div className={styles.threadList}>
        {content.messages.map((msg) => (
          <div key={msg.id} className={styles.threadCard}>
            <div className={styles.threadCardHeader}>
              <div className={styles.threadSenderLine}>
                <span className={styles.threadSenderName}>{msg.from_display}</span>
                <span className={styles.threadSenderEmail}>&lt;{msg.from_address}&gt;</span>
              </div>
              <span className={styles.threadDate}>{msg.date}</span>
            </div>

            <div className={styles.threadSubMeta}>
              {msg.reply_to && (
                <div className={styles.threadMetaRow}>
                  <span className={styles.threadMetaKey}>Reply-To:</span>
                  <span className={styles.threadMetaVal}>{msg.reply_to}</span>
                </div>
              )}
              <div className={styles.threadMetaRow}>
                <span className={styles.threadMetaKey}>To:</span>
                <span className={styles.threadMetaVal}>{msg.to}</span>
              </div>
            </div>

            <div className={styles.threadMessageBody}>{msg.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CompanyDirectoryViewer: React.FC<{ content: DirectoryContent }> = ({ content }) => {
  const { employee, policy } = content;
  return (
    <div className={styles.directoryViewer} role="region" aria-label="Internal Company Directory">
      <div className={styles.directoryHeader}>
        <Building2 size={24} className={styles.directoryIcon} aria-hidden="true" />
        <div>
          <h3 className={styles.directoryTitle}>{content.company}</h3>
          <p className={styles.directorySubtitle}>Verified Corporate Staff Registry & Policy Reference</p>
        </div>
      </div>

      <div className={styles.directoryCard}>
        <div className={styles.employeeHeader}>
          <div className={styles.employeeAvatar} aria-hidden="true">
            <UserCheck size={24} />
          </div>
          <div>
            <h4 className={styles.employeeName}>{employee.name}</h4>
            <p className={styles.employeeTitle}>{employee.title} • {employee.department}</p>
          </div>
        </div>

        <div className={styles.directoryGrid}>
          <div className={styles.directoryGridItem}>
            <span className={styles.directoryGridLabel}>Official Email:</span>
            <span className={styles.directoryGridValue}>{employee.officialEmail}</span>
          </div>
          <div className={styles.directoryGridItem}>
            <span className={styles.directoryGridLabel}>Internal Phone:</span>
            <span className={styles.directoryGridValue}>{employee.internalPhone}</span>
          </div>
          <div className={styles.directoryGridItem}>
            <span className={styles.directoryGridLabel}>Office Location:</span>
            <span className={styles.directoryGridValue}>{employee.officeLocation}</span>
          </div>
          <div className={styles.directoryGridItem}>
            <span className={styles.directoryGridLabel}>Executive Assistant:</span>
            <span className={styles.directoryGridValue}>{employee.assistant}</span>
          </div>
          <div className={`${styles.directoryGridItem} ${styles['directoryGridItem--full']}`}>
            <span className={styles.directoryGridLabel}>Current Status:</span>
            <span className={styles.directoryGridValueStatus}>{employee.currentStatus}</span>
          </div>
        </div>
      </div>

      <div className={styles.policyNotice}>
        <div className={styles.policyHeader}>
          <ShieldAlert size={18} className={styles.policyIcon} aria-hidden="true" />
          <span className={styles.policyTitle}>{policy.title} ({policy.code})</span>
        </div>
        <ul className={styles.policyList}>
          {policy.rules.map((rule, idx) => (
            <li key={idx} className={styles.policyRuleItem}>{rule}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

type HeaderRow = { field: string; value: string };
type LogContent = { rows: HeaderRow[] };

const LogViewer: React.FC<{ content: LogContent }> = ({ content }) => (
  <div className={styles.logViewer} role="region" aria-label="Email header analysis">
    <table className={styles.logTable}>
      <thead>
        <tr>
          <th scope="col">Header Field</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {content.rows.map(({ field, value }) => {
          const isFail = value.toUpperCase().startsWith('FAIL');
          const isSoftFail = value.toUpperCase().startsWith('SOFTFAIL');
          return (
            <tr key={field}>
              <td className={styles.logField}>{field}</td>
              <td className={isFail ? styles.logFail : isSoftFail ? styles.logSoftFail : ''}>
                {value}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

type AlertQueueItemData = {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rule: string;
  affectedSystem: string;
  description: string;
  context: string;
  details?: {
    sourceIp?: string;
    destIp?: string;
    processPath?: string;
    commandLine?: string;
    rawLog?: string;
  };
};

type AlertQueueContent = {
  isAlertQueue?: boolean;
  shiftInfo?: {
    team: string;
    date: string;
    queueName: string;
  };
  alerts: AlertQueueItemData[];
};

const AlertViewer: React.FC<{ content: AlertQueueContent }> = ({ content }) => {
  const [activeAlertId, setActiveAlertId] = useState<string>(
    content.alerts[0]?.id ?? ''
  );

  const activeAlert =
    content.alerts.find((a) => a.id === activeAlertId) ?? content.alerts[0];

  const severityClass = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return styles['alertSeverity--critical'];
      case 'high':
        return styles['alertSeverity--high'];
      case 'medium':
        return styles['alertSeverity--medium'];
      case 'low':
      default:
        return styles['alertSeverity--low'];
    }
  };

  return (
    <div className={styles.alertViewer} role="region" aria-label="SIEM Alert Triage Queue">
      {/* Top bar */}
      <div className={styles.alertHeader}>
        <div className={styles.alertHeaderLeft}>
          <ShieldAlert size={20} className={styles.alertIcon} aria-hidden="true" />
          <div>
            <h3 className={styles.alertTitle}>{content.shiftInfo?.team ?? 'SIEM Triage Console'}</h3>
            <p className={styles.alertShiftMeta}>
              {content.shiftInfo?.queueName ?? 'Pending Shift Review'} • {content.shiftInfo?.date ?? 'Active Shift'}
            </p>
          </div>
        </div>
        <span className={styles.alertCountBadge}>{content.alerts.length} Pending Alerts</span>
      </div>

      <div className={styles.alertLayout}>
        {/* Navigation list */}
        <div className={styles.alertQueueNav} role="tablist" aria-label="Alert queue list">
          {content.alerts.map((alert) => {
            const isSelected = alert.id === activeAlert?.id;
            return (
              <button
                key={alert.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                tabIndex={0}
                className={`${styles.alertQueueItem} ${isSelected ? styles['alertQueueItem--active'] : ''}`}
                onClick={() => setActiveAlertId(alert.id)}
              >
                <div className={styles.alertItemTop}>
                  <span className={styles.alertItemId}>{alert.id.toUpperCase()}</span>
                  <span className={`${styles.alertSeverityBadge} ${severityClass(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                <div className={styles.alertItemRule}>{alert.rule}</div>
                <div className={styles.alertItemTarget}>{alert.affectedSystem}</div>
              </button>
            );
          })}
        </div>

        {/* Detail pane */}
        {activeAlert && (
          <div className={styles.alertDetailPane} role="tabpanel" aria-label={`Details for alert ${activeAlert.id}`}>
            <div className={styles.alertDetailHeader}>
              <div className={styles.alertDetailTopRow}>
                <h4 className={styles.alertDetailTitle}>{activeAlert.rule}</h4>
                <span className={`${styles.alertSeverityBadge} ${severityClass(activeAlert.severity)}`}>
                  {activeAlert.severity} Severity
                </span>
              </div>
              <div className={styles.alertDetailMeta}>
                <div className={styles.alertDetailMetaRow}>
                  <span className={styles.alertDetailMetaKey}>Alert ID:</span>
                  <span className={styles.alertDetailMetaVal}>{activeAlert.id.toUpperCase()}</span>
                </div>
                <div className={styles.alertDetailMetaRow}>
                  <span className={styles.alertDetailMetaKey}>Timestamp:</span>
                  <span className={styles.alertDetailMetaVal}>{activeAlert.timestamp}</span>
                </div>
                <div className={styles.alertDetailMetaRow}>
                  <span className={styles.alertDetailMetaKey}>Target System:</span>
                  <span className={styles.alertDetailMetaVal}>{activeAlert.affectedSystem}</span>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div className={styles.alertSection}>
              <h5 className={styles.alertSectionTitle}>Event Description & Detection</h5>
              <p className={styles.alertSectionText}>{activeAlert.description}</p>
            </div>

            {/* Context & Notes */}
            <div className={styles.alertContextCard}>
              <h5 className={styles.alertContextTitle}>Shift Notes & Operational Context</h5>
              <p className={styles.alertContextText}>{activeAlert.context}</p>
            </div>

            {/* Technical Parameters */}
            {activeAlert.details && (
              <div className={styles.alertTechnicalCard}>
                <h5 className={styles.alertTechnicalTitle}>Technical Telemetry & Parameters</h5>
                <table className={styles.alertTechnicalTable}>
                  <tbody>
                    {activeAlert.details.sourceIp && (
                      <tr>
                        <th scope="row">Source IP / Host</th>
                        <td>{activeAlert.details.sourceIp}</td>
                      </tr>
                    )}
                    {activeAlert.details.destIp && (
                      <tr>
                        <th scope="row">Destination IP</th>
                        <td>{activeAlert.details.destIp}</td>
                      </tr>
                    )}
                    {activeAlert.details.processPath && (
                      <tr>
                        <th scope="row">Process Path</th>
                        <td>{activeAlert.details.processPath}</td>
                      </tr>
                    )}
                    {activeAlert.details.commandLine && (
                      <tr>
                        <th scope="row">Command Line</th>
                        <td>{activeAlert.details.commandLine}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {activeAlert.details.rawLog && (
                  <div className={styles.alertRawLog}>
                    {activeAlert.details.rawLog}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

type TimelineEvent = {
  id: string;
  timestamp: string;
  system: string;
  eventType: string;
  status: 'success' | 'failure' | 'warning' | 'alert';
  title: string;
  description: string;
  sourceIp: string;
  location?: string;
  device?: {
    name?: string;
    os?: string;
    browser?: string;
    isManaged?: boolean;
    trustStatus?: string;
  };
  sessionId?: string;
  rawPayload?: string;
};

type TimelineContent = {
  isTimeline: boolean;
  timelineTitle: string;
  timelineSubtitle: string;
  subjectAccount: string;
  timeRange: string;
  events: TimelineEvent[];
};

const TimelineViewer: React.FC<{ content: TimelineContent }> = ({ content }) => {
  const getStatusClass = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'success':
        return styles['timelineStatus--success'];
      case 'failure':
        return styles['timelineStatus--failure'];
      case 'alert':
        return styles['timelineStatus--alert'];
      case 'warning':
      default:
        return styles['timelineStatus--warning'];
    }
  };

  const getCardModifier = (status: TimelineEvent['status']) => {
    if (status === 'alert') return styles['timelineEventCard--alert'];
    if (status === 'warning') return styles['timelineEventCard--warning'];
    return '';
  };

  return (
    <div className={styles.timelineViewer} role="region" aria-label="Sign-in and Audit Timeline">
      <div className={styles.timelineHeader}>
        <div className={styles.timelineHeaderLeft}>
          <Activity size={20} className={styles.timelineIcon} aria-hidden="true" />
          <div>
            <h3 className={styles.timelineTitle}>{content.timelineTitle}</h3>
            <p className={styles.timelineMeta}>
              {content.subjectAccount} • {content.timeRange}
            </p>
          </div>
        </div>
        <span className={styles.timelineCountBadge}>{content.events.length} Events</span>
      </div>

      <div className={styles.timelineList}>
        {content.events.map((evt) => (
          <div
            key={evt.id}
            className={`${styles.timelineEventCard} ${getCardModifier(evt.status)}`}
          >
            <div className={styles.timelineEventTop}>
              <div className={styles.timelineEventTimeGroup}>
                <span className={styles.timelineTimestamp}>{evt.timestamp}</span>
                <span className={styles.timelineSystemTag}>{evt.system}</span>
              </div>
              <span className={`${styles.timelineStatus} ${getStatusClass(evt.status)}`}>
                {evt.status}
              </span>
            </div>

            <h4 className={styles.timelineEventTitle}>{evt.title}</h4>
            <p className={styles.timelineEventDesc}>{evt.description}</p>

            <div className={styles.timelineMetaGrid}>
              <div className={styles.timelineMetaItem}>
                <span className={styles.timelineMetaKey}>Source IP & Location:</span>
                <span className={styles.timelineMetaVal}>
                  {evt.sourceIp} {evt.location ? `(${evt.location})` : ''}
                </span>
              </div>

              {evt.device && (
                <div className={styles.timelineMetaItem}>
                  <span className={styles.timelineMetaKey}>Endpoint Posture:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span className={styles.timelineMetaVal}>{evt.device.name ?? 'Unknown Device'}</span>
                    {evt.device.isManaged !== undefined && (
                      <span
                        className={`${styles.timelineDeviceBadge} ${
                          evt.device.isManaged
                            ? styles['timelineDevice--managed']
                            : styles['timelineDevice--unmanaged']
                        }`}
                      >
                        {evt.device.isManaged ? 'Managed' : 'Unmanaged'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {evt.sessionId && (
                <div className={styles.timelineMetaItem}>
                  <span className={styles.timelineMetaKey}>Session ID:</span>
                  <span className={styles.timelineMetaVal}>{evt.sessionId}</span>
                </div>
              )}
            </div>

            {evt.rawPayload && (
              <div className={styles.timelineRawPayload}>{evt.rawPayload}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

type ExposedPortItem = {
  id: string;
  port: number;
  protocol: 'tcp' | 'udp';
  service: string;
  version?: string;
  boundAddress: string;
  reachability: 'public' | 'internal' | 'localhost';
  reachabilityLabel: string;
  purpose: string;
  businessContext: string;
  status: 'safe' | 'unsafe';
  banner?: string;
};

type ExposureReportContent = {
  isExposureReport?: boolean;
  scanTitle: string;
  scanSubtitle: string;
  targetHost: string;
  targetIpPublic: string;
  targetIpPrivate: string;
  operatingSystem: string;
  scanTimestamp: string;
  scannerTool: string;
  ports: ExposedPortItem[];
};

const ExposureReportViewer: React.FC<{ content: ExposureReportContent }> = ({ content }) => {
  return (
    <div className={styles.exposureViewer} role="region" aria-label="System Exposure and Port Audit Report">
      {/* Header and system summary */}
      <div className={styles.exposureHeader}>
        <div className={styles.exposureHeaderLeft}>
          <Network size={22} className={styles.exposureIcon} aria-hidden="true" />
          <div>
            <h3 className={styles.exposureTitle}>{content.scanTitle}</h3>
            <p className={styles.exposureSubtitle}>{content.scanSubtitle}</p>
          </div>
        </div>
        <div className={styles.exposureCountBadge}>
          {content.ports.length} Listening Ports
        </div>
      </div>

      <div className={styles.exposureMetaGrid}>
        <div className={styles.exposureMetaCard}>
          <span className={styles.exposureMetaLabel}>Host Target</span>
          <span className={styles.exposureMetaValue}>{content.targetHost}</span>
        </div>
        <div className={styles.exposureMetaCard}>
          <span className={styles.exposureMetaLabel}>Public IP</span>
          <span className={styles.exposureMetaValue}>{content.targetIpPublic}</span>
        </div>
        <div className={styles.exposureMetaCard}>
          <span className={styles.exposureMetaLabel}>Internal IP</span>
          <span className={styles.exposureMetaValue}>{content.targetIpPrivate}</span>
        </div>
        <div className={styles.exposureMetaCard}>
          <span className={styles.exposureMetaLabel}>OS & Scanner</span>
          <span className={styles.exposureMetaValue}>{content.operatingSystem} ({content.scannerTool})</span>
        </div>
      </div>

      {/* Table of listening ports */}
      <div className={styles.exposureTableWrapper}>
        <table className={styles.exposureTable}>
          <thead>
            <tr>
              <th scope="col">Port / Proto</th>
              <th scope="col">Service & Version</th>
              <th scope="col">Bound Interface</th>
              <th scope="col">Reachability</th>
              <th scope="col">Service Purpose & Context</th>
            </tr>
          </thead>
          <tbody>
            {content.ports.map((p) => {
              const reachabilityBadgeClass =
                p.reachability === 'public'
                  ? styles['exposureBadge--public']
                  : p.reachability === 'internal'
                  ? styles['exposureBadge--internal']
                  : styles['exposureBadge--localhost'];

              return (
                <tr key={p.id} className={styles.exposureRow}>
                  <td className={styles.exposurePortCell}>
                    <div className={styles.exposurePortGroup}>
                      <span className={styles.exposurePortNum}>{p.port}</span>
                      <span className={styles.exposureProtoTag}>{p.protocol.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className={styles.exposureServiceCell}>
                    <div className={styles.exposureServiceName}>{p.service}</div>
                    {p.version && <div className={styles.exposureServiceVer}>{p.version}</div>}
                    {p.banner && <div className={styles.exposureBanner}>{p.banner}</div>}
                  </td>
                  <td className={styles.exposureBoundCell}>
                    <code className={styles.exposureBoundCode}>{p.boundAddress}</code>
                  </td>
                  <td className={styles.exposureReachCell}>
                    <span className={`${styles.exposureReachBadge} ${reachabilityBadgeClass}`}>
                      {p.reachabilityLabel}
                    </span>
                  </td>
                  <td className={styles.exposureContextCell}>
                    <div className={styles.exposurePurpose}>{p.purpose}</div>
                    <div className={styles.exposureBizCtx}>{p.businessContext}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

type PolicyDocumentContent = {
  title: string;
  code: string;
  category?: string;
  effectiveDate?: string;
  classification?: string;
  rules: string[];
};

const PolicyDocumentViewer: React.FC<{ content: PolicyDocumentContent }> = ({ content }) => (
  <div className={styles.policyNotice} role="region" aria-label={`Security Policy: ${content.title}`}>
    <div className={styles.policyHeader}>
      <ShieldAlert size={18} className={styles.policyIcon} aria-hidden="true" />
      <div>
        <span className={styles.policyTitle}>{content.title} ({content.code})</span>
        {(content.effectiveDate || content.classification) && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {content.classification && <span>{content.classification}</span>}
            {content.classification && content.effectiveDate && <span> • </span>}
            {content.effectiveDate && <span>Effective: {content.effectiveDate}</span>}
          </div>
        )}
      </div>
    </div>
    <ul className={styles.policyList}>
      {content.rules.map((rule, idx) => (
        <li key={idx} className={styles.policyRuleItem}>{rule}</li>
      ))}
    </ul>
  </div>
);

type FirewallZone = {
  id: string;
  name: string;
  cidr: string;
  trustLevel: string;
  description: string;
};

type FirewallRuleItem = {
  ruleNum: number;
  id: string;
  sourceZone: string;
  destZone: string;
  service: string;
  action: 'ACCEPT' | 'DROP' | 'REJECT';
  log: boolean;
  ticket?: string;
  description: string;
};

type FirewallNatVip = {
  vip: string;
  targetIp: string;
  service: string;
  zone: string;
  description: string;
};

type FirewallNatArchitecture = {
  model: string;
  summary: string;
  vipMappings: FirewallNatVip[];
};

type FirewallPolicyContent = {
  isFirewallPolicy?: boolean;
  applianceName: string;
  policyName: string;
  evaluationModel: string;
  lastAuditDate: string;
  firewallVendor: string;
  natArchitecture?: FirewallNatArchitecture;
  zones: FirewallZone[];
  rulesTable: FirewallRuleItem[];
};

const FirewallRuleViewer: React.FC<{ content: FirewallPolicyContent }> = ({ content }) => {
  return (
    <div className={styles.firewallViewer} role="region" aria-label="Enterprise Firewall Policy and Ruleset">
      {/* Header and Appliance Meta */}
      <div className={styles.firewallHeader}>
        <div className={styles.firewallHeaderLeft}>
          <Network size={22} className={styles.firewallIcon} aria-hidden="true" />
          <div>
            <h3 className={styles.firewallTitle}>{content.policyName}</h3>
            <p className={styles.firewallSubtitle}>
              {content.applianceName} • {content.firewallVendor}
            </p>
          </div>
        </div>
        <div className={styles.firewallCountBadge}>
          {content.rulesTable.length} Ordered Rules
        </div>
      </div>

      {/* Evaluation Semantics Alert Banner */}
      <div className={styles.firewallSemanticsBanner}>
        <div className={styles.firewallSemanticsTitle}>
          <ShieldAlert size={16} aria-hidden="true" />
          <span>Evaluation Semantics: {content.evaluationModel}</span>
        </div>
        <p className={styles.firewallSemanticsText}>
          Traffic is evaluated sequentially from Rule #1 downwards. The <strong>first rule that matches</strong> source, destination, and service executes immediately. Subsequent rules are never evaluated. Unmatched traffic hits the default drop rule.
        </p>
      </div>

      {/* NAT & VIP Architecture Section */}
      {content.natArchitecture && (
        <div className={styles.firewallNatSection}>
          <div className={styles.firewallNatHeader}>
            <ExternalLink size={15} aria-hidden="true" />
            <span className={styles.firewallNatTitle}>{content.natArchitecture.model}</span>
          </div>
          <p className={styles.firewallNatSummary}>{content.natArchitecture.summary}</p>
          <div className={styles.firewallVipTableWrapper}>
            <table className={styles.firewallVipTable}>
              <thead>
                <tr>
                  <th scope="col">Public VIP</th>
                  <th scope="col">Pre-Routing DNAT Target</th>
                  <th scope="col">Service</th>
                  <th scope="col">Mapped Purpose</th>
                </tr>
              </thead>
              <tbody>
                {content.natArchitecture.vipMappings.map((vip) => (
                  <tr key={vip.vip}>
                    <td>
                      <code className={styles.firewallZoneCode}>{vip.vip}</code>
                    </td>
                    <td>
                      <code className={styles.firewallZoneCode}>{vip.targetIp}</code>
                      <span className={styles.firewallVipZoneTag}>{vip.zone}</span>
                    </td>
                    <td className={styles.firewallVipService}>{vip.service}</td>
                    <td className={styles.firewallVipDesc}>{vip.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Network Zone Legend Cards */}
      <div className={styles.firewallZonesSection}>
        <h4 className={styles.firewallSectionHeading}>Enterprise Network Zones</h4>
        <div className={styles.firewallZoneGrid}>
          {content.zones.map((zone) => (
            <div key={zone.id} className={styles.firewallZoneCard}>
              <div className={styles.firewallZoneHeader}>
                <span className={styles.firewallZoneTag}>{zone.id}</span>
                <code className={styles.firewallZoneCidr}>{zone.cidr}</code>
              </div>
              <div className={styles.firewallZoneName}>{zone.name}</div>
              <div className={styles.firewallZoneTrust}>{zone.trustLevel}</div>
              <div className={styles.firewallZoneDesc}>{zone.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ordered Rules Table */}
      <div className={styles.firewallTableSection}>
        <h4 className={styles.firewallSectionHeading}>Ordered Policy Ruleset (First Match Wins)</h4>
        <div className={styles.firewallTableWrapper}>
          <table className={styles.firewallTable}>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Source</th>
                <th scope="col">Destination</th>
                <th scope="col">Service / Port</th>
                <th scope="col">Action</th>
                <th scope="col">Ticket &amp; Business Justification</th>
              </tr>
            </thead>
            <tbody>
              {content.rulesTable.map((r) => {
                const isAccept = r.action === 'ACCEPT';
                return (
                  <tr key={r.id} className={styles.firewallRuleRow}>
                    <td className={styles.firewallRuleNumCell}>
                      <span className={styles.firewallRuleNumBadge}>#{r.ruleNum}</span>
                    </td>
                    <td className={styles.firewallZoneCell}>
                      <code className={styles.firewallZoneCode}>{r.sourceZone}</code>
                    </td>
                    <td className={styles.firewallZoneCell}>
                      <code className={styles.firewallZoneCode}>{r.destZone}</code>
                    </td>
                    <td className={styles.firewallServiceCell}>
                      <span className={styles.firewallServiceText}>{r.service}</span>
                    </td>
                    <td className={styles.firewallActionCell}>
                      <span
                        className={`${styles.firewallActionBadge} ${
                          isAccept
                            ? styles['firewallActionBadge--accept']
                            : styles['firewallActionBadge--drop']
                        }`}
                      >
                        {r.action}
                      </span>
                    </td>
                    <td className={styles.firewallContextCell}>
                      {r.ticket && (
                        <span className={styles.firewallTicketBadge}>{r.ticket}</span>
                      )}
                      <div className={styles.firewallDescText}>{r.description}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

type PacketTraceRowItem = {
  packetNum: number;
  timestamp: string;
  sourceIp: string;
  sourcePort: number;
  destIp: string;
  destPort: number;
  protocol: 'DNS' | 'TLS' | 'NTP' | 'HTTP';
  lengthBytes: number;
  summary: string;
  isTunnelingQuery?: boolean;
  encodedPayloadLength?: number;
  subdomainLabel?: string;
  dnsDetails?: {
    queryType: string;
    queryName: string;
    transactionId: string;
    flags: string;
    responseCode?: string;
  };
};

type PacketTraceContent = {
  isPacketTrace?: boolean;
  captureFile: string;
  captureInterface: string;
  captureDuration: string;
  totalPackets: number;
  appliance: string;
  methodologyNote: {
    title: string;
    formula: string;
    chunkDefinition: string;
    distinctions: string[];
  };
  packets: PacketTraceRowItem[];
};

const PacketTraceViewer: React.FC<{ content: PacketTraceContent }> = ({ content }) => {
  const [filterProtocol, setFilterProtocol] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPacketNum, setSelectedPacketNum] = useState<number | null>(null);

  const filteredPackets = useMemo(() => {
    return content.packets.filter((p) => {
      if (filterProtocol !== 'all' && p.protocol !== filterProtocol) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesIp = p.sourceIp.toLowerCase().includes(term) || p.destIp.toLowerCase().includes(term);
        const matchesSummary = p.summary.toLowerCase().includes(term);
        const matchesProto = p.protocol.toLowerCase().includes(term);
        const matchesQuery = p.dnsDetails?.queryName?.toLowerCase().includes(term) || false;
        if (!matchesIp && !matchesSummary && !matchesProto && !matchesQuery) return false;
      }
      return true;
    });
  }, [content.packets, filterProtocol, searchTerm]);

  const selectedPacket = useMemo(() => {
    return content.packets.find((p) => p.packetNum === selectedPacketNum) || null;
  }, [content.packets, selectedPacketNum]);

  return (
    <div className={styles.packetViewer} role="region" aria-label="Network Packet Capture and Analysis">
      {/* Capture Metadata Header */}
      <div className={styles.packetHeader}>
        <div className={styles.packetHeaderLeft}>
          <Activity size={22} className={styles.packetIcon} aria-hidden="true" />
          <div>
            <h3 className={styles.packetTitle}>{content.captureFile}</h3>
            <p className={styles.packetMeta}>
              <span>Interface: <strong>{content.captureInterface}</strong></span>
              <span className={styles.metaDivider}>•</span>
              <span>Window: <strong>{content.captureDuration}</strong></span>
              <span className={styles.metaDivider}>•</span>
              <span>Total Packets: <strong>{content.totalPackets}</strong></span>
            </p>
          </div>
        </div>
        <div className={styles.packetApplianceBadge}>
          {content.appliance}
        </div>
      </div>

      {/* Methodology & Calculation Note Card */}
      {content.methodologyNote && (
        <div className={styles.packetMethodologyCard}>
          <div className={styles.packetMethodologyHeader}>
            <FileText size={15} aria-hidden="true" />
            <span className={styles.packetMethodologyTitle}>{content.methodologyNote.title}</span>
          </div>
          <div className={styles.packetMethodologyFormula}>
            <code>{content.methodologyNote.formula}</code>
          </div>
          <p className={styles.packetMethodologyChunk}>{content.methodologyNote.chunkDefinition}</p>
          <ul className={styles.packetMethodologyList}>
            {content.methodologyNote.distinctions.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className={styles.packetFilterBar}>
        <div className={styles.packetSearchBox}>
          <Search size={14} className={styles.packetSearchIcon} aria-hidden="true" />
          <input
            type="text"
            className={styles.packetSearchInput}
            placeholder="Search IP, domain, protocol, or summary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Filter packets by keyword"
          />
          {searchTerm && (
            <button
              type="button"
              className={styles.packetSearchClear}
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.packetProtocolTabs}>
          <button
            type="button"
            className={`${styles.packetProtoTab} ${filterProtocol === 'all' ? styles.packetProtoTabActive : ''}`}
            onClick={() => setFilterProtocol('all')}
          >
            All ({content.packets.length})
          </button>
          <button
            type="button"
            className={`${styles.packetProtoTab} ${filterProtocol === 'DNS' ? styles.packetProtoTabActive : ''}`}
            onClick={() => setFilterProtocol('DNS')}
          >
            DNS ({content.packets.filter((p) => p.protocol === 'DNS').length})
          </button>
          <button
            type="button"
            className={`${styles.packetProtoTab} ${filterProtocol === 'TLS' ? styles.packetProtoTabActive : ''}`}
            onClick={() => setFilterProtocol('TLS')}
          >
            TLS/HTTPS ({content.packets.filter((p) => p.protocol === 'TLS').length})
          </button>
          <button
            type="button"
            className={`${styles.packetProtoTab} ${filterProtocol === 'NTP' ? styles.packetProtoTabActive : ''}`}
            onClick={() => setFilterProtocol('NTP')}
          >
            NTP ({content.packets.filter((p) => p.protocol === 'NTP').length})
          </button>
        </div>

        <div className={styles.packetCountBadge}>
          Showing {filteredPackets.length} of {content.packets.length} packets
        </div>
      </div>

      {/* Packet Table */}
      <div className={styles.packetTableWrapper}>
        <table className={styles.packetTable}>
          <thead>
            <tr>
              <th scope="col" style={{ width: '45px' }}>#</th>
              <th scope="col" style={{ width: '95px' }}>Time</th>
              <th scope="col" style={{ width: '150px' }}>Source</th>
              <th scope="col" style={{ width: '150px' }}>Destination</th>
              <th scope="col" style={{ width: '70px' }}>Proto</th>
              <th scope="col" style={{ width: '65px' }}>Length</th>
              <th scope="col">Info / Payload Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredPackets.map((pkt) => {
              const isSelected = pkt.packetNum === selectedPacketNum;
              return (
                <tr
                  key={pkt.packetNum}
                  onClick={() => setSelectedPacketNum(isSelected ? null : pkt.packetNum)}
                  className={`${styles.packetRow} ${isSelected ? styles.packetRowSelected : ''}`}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedPacketNum(isSelected ? null : pkt.packetNum);
                    }
                  }}
                >
                  <td className={styles.packetNumCell}>{pkt.packetNum}</td>
                  <td className={styles.packetTimeCell}>{pkt.timestamp}</td>
                  <td className={styles.packetAddrCell}>
                    <code>{pkt.sourceIp}:{pkt.sourcePort}</code>
                  </td>
                  <td className={styles.packetAddrCell}>
                    <code>{pkt.destIp}:{pkt.destPort}</code>
                  </td>
                  <td>
                    <span className={`${styles.packetProtoTag} ${styles[`proto_${pkt.protocol}`]}`}>
                      {pkt.protocol}
                    </span>
                  </td>
                  <td className={styles.packetLengthCell}>{pkt.lengthBytes} B</td>
                  <td className={styles.packetSummaryCell}>
                    <span>{pkt.summary}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Packet Inspection Inspector Panel */}
      {selectedPacket && (
        <div className={styles.packetInspector}>
          <div className={styles.packetInspectorHeader}>
            <div className={styles.packetInspectorTitle}>
              Frame #{selectedPacket.packetNum}: Protocol Dissection ({selectedPacket.protocol}, {selectedPacket.lengthBytes} bytes)
            </div>
            <button
              type="button"
              className={styles.packetInspectorClose}
              onClick={() => setSelectedPacketNum(null)}
              aria-label="Close packet inspector"
            >
              ×
            </button>
          </div>
          <div className={styles.packetInspectorBody}>
            <div className={styles.packetLayerItem}>
              <strong>Layer 2/3:</strong> Ethernet II, Src: <code>{selectedPacket.sourceIp}</code>, Dst: <code>{selectedPacket.destIp}</code>, IPv4
            </div>
            <div className={styles.packetLayerItem}>
              <strong>Layer 4:</strong> {selectedPacket.protocol === 'TLS' ? 'TCP' : 'UDP'}, Src Port: <code>{selectedPacket.sourcePort}</code>, Dst Port: <code>{selectedPacket.destPort}</code>
            </div>
            {selectedPacket.dnsDetails && (
              <div className={styles.packetLayerItem}>
                <strong>Layer 7 (DNS):</strong> Transaction ID: <code>{selectedPacket.dnsDetails.transactionId}</code> | Type: <code>{selectedPacket.dnsDetails.queryType}</code> | Flags: <code>{selectedPacket.dnsDetails.flags}</code>
                <div style={{ marginTop: '4px' }}>
                  Query Name: <code>{selectedPacket.dnsDetails.queryName}</code>
                </div>
                {(() => {
                  const queryParts = selectedPacket.dnsDetails.queryName.split('.');
                  const firstLabel = queryParts[0] || '';
                  return (
                    <div className={styles.packetLabelDissection}>
                      <div>Initial Subdomain Label: <code>{firstLabel}</code></div>
                      <div>Label Length: <strong>{firstLabel.length} characters ({firstLabel.length} bytes ASCII)</strong></div>
                      <div>Total Packet Frame Length: <strong>{selectedPacket.lengthBytes} bytes</strong></div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FileSystemViewer: React.FC<{ content: FileSystemContent }> = ({ content }) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(
    content.files.length > 0 ? content.files[0].id : null
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'deleted' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredFiles = useMemo(() => {
    return content.files.filter((file) => {
      if (statusFilter !== 'all' && file.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = file.name.toLowerCase().includes(query);
        const matchPath = file.path.toLowerCase().includes(query);
        const matchType = file.fileType.toLowerCase().includes(query);
        const matchNotes = file.notes?.toLowerCase().includes(query) ?? false;
        if (!matchName && !matchPath && !matchType && !matchNotes) {
          return false;
        }
      }
      return true;
    });
  }, [content.files, statusFilter, searchTerm]);

  const selectedFile = useMemo(() => {
    return content.files.find((f) => f.id === selectedFileId) || null;
  }, [content.files, selectedFileId]);

  return (
    <div className={styles.fsViewer} role="region" aria-label="Workstation Filesystem Triage and Deleted File Recovery">
      {/* Header */}
      <div className={styles.fsHeader}>
        <div className={styles.fsHeaderLeft}>
          <HardDrive size={22} className={styles.fsIcon} aria-hidden="true" />
          <div>
            <h3 className={styles.fsTitle}>{content.imageFileName}</h3>
            <p className={styles.fsMeta}>
              <span>Host: <strong>{content.targetDevice}</strong></span>
              <span className={styles.metaDivider}>•</span>
              <span>FS: <strong>{content.filesystemType}</strong></span>
              <span className={styles.metaDivider}>•</span>
              <span>Scanned Records: <strong>{content.totalRecordsScanned.toLocaleString()}</strong></span>
            </p>
          </div>
        </div>
        <div className={styles.fsCaseBadge}>
          {content.caseReference}
        </div>
      </div>

      {/* Guidance Note Card */}
      {content.guidanceNote && (
        <div className={styles.fsGuidanceCard}>
          <div className={styles.fsGuidanceHeader}>
            <FileText size={15} aria-hidden="true" />
            <span className={styles.fsGuidanceTitle}>{content.guidanceNote.title}</span>
          </div>
          <ul className={styles.fsGuidanceList}>
            {content.guidanceNote.rules.map((rule, idx) => (
              <li key={idx}>{rule}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className={styles.fsFilterBar}>
        <div className={styles.fsSearchBox}>
          <Search size={14} className={styles.fsSearchIcon} aria-hidden="true" />
          <input
            type="text"
            className={styles.fsSearchInput}
            placeholder="Search path, filename, type, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Filter filesystem by keyword"
          />
          {searchTerm && (
            <button
              type="button"
              className={styles.fsSearchClear}
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.fsFilterTabs}>
          <button
            type="button"
            className={`${styles.fsFilterTab} ${statusFilter === 'all' ? styles.fsFilterTabActive : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Files ({content.files.length})
          </button>
          <button
            type="button"
            className={`${styles.fsFilterTab} ${statusFilter === 'deleted' ? styles.fsFilterTabActive : ''}`}
            onClick={() => setStatusFilter('deleted')}
          >
            Deleted / Carved ({content.files.filter((f) => f.status === 'deleted').length})
          </button>
          <button
            type="button"
            className={`${styles.fsFilterTab} ${statusFilter === 'active' ? styles.fsFilterTabActive : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active / Allocated ({content.files.filter((f) => f.status === 'active').length})
          </button>
        </div>

        <div className={styles.fsCountBadge}>
          Showing {filteredFiles.length} of {content.files.length} files
        </div>
      </div>

      {/* Split Pane: File Table + Inspector */}
      <div className={styles.fsLayout}>
        {/* File Table Column */}
        <div className={styles.fsTableColumn}>
          <div className={styles.fsTableWrapper}>
            <table className={styles.fsTable}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: '80px' }}>Status</th>
                  <th scope="col">File Name & Path</th>
                  <th scope="col" style={{ width: '70px' }}>Size</th>
                  <th scope="col" style={{ width: '130px' }}>Modified / Deleted</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => {
                  const isSelected = file.id === selectedFileId;
                  const isDeleted = file.status === 'deleted';
                  return (
                    <tr
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      className={`${styles.fsRow} ${isSelected ? styles.fsRowSelected : ''}`}
                      tabIndex={0}
                      role="button"
                      aria-pressed={isSelected}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedFileId(file.id);
                        }
                      }}
                    >
                      <td>
                        <span className={`${styles.fsStatusTag} ${isDeleted ? styles.fsStatusDeleted : styles.fsStatusActive}`}>
                          {isDeleted ? 'Deleted' : 'Active'}
                        </span>
                      </td>
                      <td className={styles.fsNameCell}>
                        <div className={styles.fsFileNameRow}>
                          {isDeleted ? (
                            <Trash2 size={13} className={styles.fsFileIconDeleted} aria-hidden="true" />
                          ) : (
                            <File size={13} className={styles.fsFileIconActive} aria-hidden="true" />
                          )}
                          <span className={styles.fsFileName}>{file.name}</span>
                        </div>
                        <span className={styles.fsFilePath}>{file.path}</span>
                      </td>
                      <td className={styles.fsSizeCell}>{file.sizeFormatted}</td>
                      <td className={styles.fsTimeCell}>
                        {isDeleted ? file.deletionTime.replace(' UTC', '') : file.modifiedTime.replace(' UTC', '')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspector & Recovered Content Preview Column */}
        <div className={styles.fsInspectorColumn}>
          {selectedFile ? (
            <div className={styles.fsInspector}>
              <div className={styles.fsInspectorHeader}>
                <div className={styles.fsInspectorTitleGroup}>
                  <span className={`${styles.fsStatusTag} ${selectedFile.status === 'deleted' ? styles.fsStatusDeleted : styles.fsStatusActive}`}>
                    {selectedFile.status === 'deleted' ? 'Deleted / Carved' : 'Active / Allocated'}
                  </span>
                  <span className={styles.fsInspectorFilename}>{selectedFile.name}</span>
                </div>
              </div>

              <div className={styles.fsMetaGrid}>
                <div className={styles.fsMetaItem}>
                  <span className={styles.fsMetaLabel}>Canonical Path</span>
                  <code className={styles.fsMetaValue}>{selectedFile.path}</code>
                </div>
                <div className={styles.fsMetaItem}>
                  <span className={styles.fsMetaLabel}>Allocation State</span>
                  <span className={styles.fsMetaValue}>
                    {selectedFile.allocated ? 'Allocated Inode (Active)' : 'Unallocated Clusters (MFT Flag 0x00)'}
                  </span>
                </div>
                <div className={styles.fsMetaItem}>
                  <span className={styles.fsMetaLabel}>File Size</span>
                  <span className={styles.fsMetaValue}>{selectedFile.sizeFormatted} ({selectedFile.sizeBytes.toLocaleString()} bytes)</span>
                </div>
                <div className={styles.fsMetaItem}>
                  <span className={styles.fsMetaLabel}>File Type & Header</span>
                  <span className={styles.fsMetaValue}>{selectedFile.fileType} (Magic: <code>{selectedFile.signatureMagic}</code>)</span>
                </div>
                <div className={styles.fsMetaItem}>
                  <span className={styles.fsMetaLabel}>MACB Timestamps</span>
                  <div className={styles.fsTimestampsBlock}>
                    <div>Created: <code>{selectedFile.createdTime}</code></div>
                    <div>Modified: <code>{selectedFile.modifiedTime}</code></div>
                    <div>Deleted: <code>{selectedFile.deletionTime}</code></div>
                  </div>
                </div>
                <div className={styles.fsMetaItem}>
                  <span className={styles.fsMetaLabel}>SHA-256 Checksum</span>
                  <code className={styles.fsHashValue}>{selectedFile.sha256}</code>
                </div>
              </div>

              {/* Recovered Content Preview */}
              <div className={styles.fsPreviewSection}>
                <div className={styles.fsPreviewHeader}>
                  <FileText size={13} aria-hidden="true" />
                  <span>Recovered Content Preview</span>
                </div>
                <pre className={styles.fsPreviewContent}>
                  <code>{selectedFile.preview}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className={styles.fsEmptyInspector}>
              <p>Select any file from the triage list to inspect its metadata and recovered content preview.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BrowserHistoryViewer: React.FC<{ content: BrowserHistoryContent }> = ({ content }) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    content.records.length > 0 ? content.records[0].recordId : null
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [transitionFilter, setTransitionFilter] = useState<'all' | 'typed' | 'link' | 'auto_subframe'>('all');

  const filteredRecords = useMemo(() => {
    return content.records.filter((rec) => {
      if (transitionFilter !== 'all' && rec.transition !== transitionFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchUrl = rec.url.toLowerCase().includes(query);
        const matchTitle = rec.title.toLowerCase().includes(query);
        const matchId = rec.recordId.toLowerCase().includes(query) || String(rec.id) === query;
        const matchNotes = rec.notes?.toLowerCase().includes(query) ?? false;
        if (!matchUrl && !matchTitle && !matchId && !matchNotes) {
          return false;
        }
      }
      return true;
    });
  }, [content.records, transitionFilter, searchTerm]);

  const selectedRecord = useMemo(() => {
    return content.records.find((r) => r.recordId === selectedRecordId) || null;
  }, [content.records, selectedRecordId]);

  return (
    <div className={styles.bhViewer} role="region" aria-label="Workstation Browser History Triage">
      <div className={styles.bhHeader}>
        <div className={styles.bhHeaderLeft}>
          <Globe size={22} className={styles.bhIcon} aria-hidden="true" />
          <div>
            <h3 className={styles.bhTitle}>{content.sourceFile}</h3>
            <p className={styles.bhMeta}>
              <span>Host: <strong>{content.host}</strong></span>
              <span className={styles.metaDivider}>•</span>
              <span>Profile: <strong>{content.browserProfile}</strong></span>
              <span className={styles.metaDivider}>•</span>
              <span>Records: <strong>{content.totalRecords}</strong></span>
            </p>
          </div>
        </div>
        <div className={styles.bhCaseBadge}>{content.caseReference}</div>
      </div>

      {content.guidanceNote && (
        <div className={styles.bhGuidanceCard}>
          <div className={styles.bhGuidanceHeader}>
            <FileText size={15} aria-hidden="true" />
            <span>{content.guidanceNote.title}</span>
          </div>
          <ul className={styles.bhGuidanceList}>
            {content.guidanceNote.rules.map((rule, idx) => (
              <li key={idx}>{rule}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.bhFilterBar}>
        <div className={styles.bhFilterLeft}>
          <div className={styles.bhSearchBox}>
            <Search size={14} className={styles.bhSearchIcon} aria-hidden="true" />
            <input
              type="text"
              className={styles.bhSearchInput}
              placeholder="Search URL, title, or record..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Filter browser history by keyword"
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.bhSearchClear}
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className={styles.bhFilterButtons} role="radiogroup" aria-label="Filter by transition type">
            {(['all', 'typed', 'link', 'auto_subframe'] as const).map((trans) => (
              <button
                key={trans}
                type="button"
                className={`${styles.bhFilterBtn} ${transitionFilter === trans ? styles.bhFilterBtnActive : ''}`}
                onClick={() => setTransitionFilter(trans)}
              >
                {trans === 'all' ? 'All Transitions' : trans === 'auto_subframe' ? 'Subframe' : trans.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.bhCountBadge}>
          Showing {filteredRecords.length} of {content.records.length} records
        </div>
      </div>

      <div className={styles.bhLayout}>
        <div className={styles.bhTableWrapper}>
          <table className={styles.bhTable}>
            <thead>
              <tr>
                <th scope="col" style={{ width: '45px' }}>#</th>
                <th scope="col" style={{ width: '130px' }}>Visited (UTC)</th>
                <th scope="col">Title &amp; Destination URL</th>
                <th scope="col" style={{ width: '90px' }}>Transition</th>
                <th scope="col" style={{ width: '75px' }}>Visits</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => {
                const isSelected = rec.recordId === selectedRecordId;
                return (
                  <tr
                    key={rec.recordId}
                    onClick={() => setSelectedRecordId(rec.recordId)}
                    className={`${styles.bhRow} ${isSelected ? styles.bhRowSelected : ''}`}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedRecordId(rec.recordId);
                      }
                    }}
                  >
                    <td>
                      <span className={styles.bhIdBadge}>#{rec.id}</span>
                    </td>
                    <td className={styles.bhTimeCell}>
                      {rec.visitTime.replace(' UTC', '')}
                    </td>
                    <td className={styles.bhTitleUrlCell}>
                      <span className={styles.bhTitleText}>{rec.title || '(No page title recorded)'}</span>
                      <span className={styles.bhUrlText}>{rec.url}</span>
                    </td>
                    <td>
                      <span className={`${styles.bhTransitionTag} ${styles[`bhTransition_${rec.transition}`] || ''}`}>
                        {rec.transition}
                      </span>
                    </td>
                    <td className={styles.bhCountsCell}>
                      {rec.visitCount}v / {rec.typedCount}t
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.bhInspectorColumn}>
          {selectedRecord ? (
            <div className={styles.bhInspector}>
              <div className={styles.bhInspectorHeader}>
                <div className={styles.bhInspectorTitleGroup}>
                  <span className={styles.bhIdBadge}>SQLite ID #{selectedRecord.id}</span>
                  <span className={`${styles.bhTransitionTag} ${styles[`bhTransition_${selectedRecord.transition}`] || ''}`}>
                    {selectedRecord.transition}
                  </span>
                </div>
                <span className={styles.bhInspectorTitle}>{selectedRecord.recordId.toUpperCase()}</span>
              </div>

              <div className={styles.bhInspectorUrl}>{selectedRecord.url}</div>

              <div className={styles.bhMetaGrid}>
                <div className={styles.bhMetaItem}>
                  <span className={styles.bhMetaLabel}>Page Title</span>
                  <span className={styles.bhMetaValue}>{selectedRecord.title || '(None)'}</span>
                </div>
                <div className={styles.bhMetaItem}>
                  <span className={styles.bhMetaLabel}>Recorded Visit Time (UTC)</span>
                  <span className={styles.bhMetaValue}><code>{selectedRecord.visitTime}</code></span>
                </div>
                <div className={styles.bhMetaItem}>
                  <span className={styles.bhMetaLabel}>Transition Type Semantics</span>
                  <span className={styles.bhMetaValue}>
                    {selectedRecord.transition === 'typed'
                      ? 'Direct manual address bar entry (Typed by user)'
                      : selectedRecord.transition === 'link'
                      ? 'Followed hyperlink from referring webpage'
                      : 'Passive embedded subframe (ad/tracker pixel/resource; no manual click)'}
                  </span>
                </div>
                <div className={styles.bhMetaItem}>
                  <span className={styles.bhMetaLabel}>Visit / Typed Counters</span>
                  <span className={styles.bhMetaValue}>
                    Visit Count: <strong>{selectedRecord.visitCount}</strong> | Typed Count: <strong>{selectedRecord.typedCount}</strong>
                  </span>
                </div>
                <div className={styles.bhMetaItem}>
                  <span className={styles.bhMetaLabel}>Hidden Resource Flag</span>
                  <span className={styles.bhMetaValue}>{selectedRecord.hidden ? 'True (Hidden / Subframe)' : 'False (User-Visible Tab)'}</span>
                </div>
              </div>

              {selectedRecord.notes && (
                <div className={styles.bhNoteSection}>
                  <div className={styles.bhNoteHeader}>Forensic Triage Note</div>
                  <div>{selectedRecord.notes}</div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.bhEmptyInspector}>
              <p>Select any browser history row to inspect SQLite record details and transitions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProxyLogViewer: React.FC<{ content: ProxyLogContent }> = ({ content }) => {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    content.entries.length > 0 ? content.entries[0].id : null
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'GET' | 'POST'>('all');

  const filteredEntries = useMemo(() => {
    return content.entries.filter((entry) => {
      if (methodFilter !== 'all' && entry.method !== methodFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchUrl = entry.destinationUrl.toLowerCase().includes(query);
        const matchHost = entry.host.toLowerCase().includes(query);
        const matchCat = entry.category.toLowerCase().includes(query);
        const matchNotes = entry.notes?.toLowerCase().includes(query) ?? false;
        if (!matchUrl && !matchHost && !matchCat && !matchNotes) {
          return false;
        }
      }
      return true;
    });
  }, [content.entries, methodFilter, searchTerm]);

  const selectedEntry = useMemo(() => {
    return content.entries.find((e) => e.id === selectedEntryId) || null;
  }, [content.entries, selectedEntryId]);

  return (
    <div className={styles.proxyViewer} role="region" aria-label="Forward Proxy Egress Logs">
      <div className={styles.proxyHeader}>
        <div className={styles.proxyHeaderLeft}>
          <Network size={22} className={styles.proxyIcon} aria-hidden="true" />
          <div>
            <h3 className={styles.proxyTitle}>{content.appliance}</h3>
            <p className={styles.proxyMeta}>
              <span>Client: <strong>{content.monitoredClientIp}</strong></span>
              <span className={styles.metaDivider}>•</span>
              <span>User: <strong>{content.authenticatedUser}</strong></span>
              <span className={styles.metaDivider}>•</span>
              <span>Capture File: <code>{content.logFile}</code></span>
            </p>
          </div>
        </div>
        <div className={styles.bhCaseBadge}>{content.timeRange}</div>
      </div>

      {content.guidanceNote && (
        <div className={styles.proxyGuidanceCard}>
          <div className={styles.proxyGuidanceHeader}>
            <FileText size={15} aria-hidden="true" />
            <span>{content.guidanceNote.title}</span>
          </div>
          <ul className={styles.proxyGuidanceList}>
            {content.guidanceNote.rules.map((rule, idx) => (
              <li key={idx}>{rule}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.proxyFilterBar}>
        <div className={styles.bhFilterLeft}>
          <div className={styles.bhSearchBox}>
            <Search size={14} className={styles.bhSearchIcon} aria-hidden="true" />
            <input
              type="text"
              className={styles.bhSearchInput}
              placeholder="Search URL, host, category, or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Filter proxy logs by keyword"
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.bhSearchClear}
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className={styles.bhFilterButtons} role="radiogroup" aria-label="Filter by HTTP method">
            {(['all', 'GET', 'POST'] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={`${styles.bhFilterBtn} ${methodFilter === m ? styles.bhFilterBtnActive : ''}`}
                onClick={() => setMethodFilter(m)}
              >
                {m === 'all' ? 'All Methods' : m}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.bhCountBadge}>
          Showing {filteredEntries.length} of {content.entries.length} proxy records
        </div>
      </div>

      <div className={styles.proxyLayout}>
        <div className={styles.proxyTableWrapper}>
          <table className={styles.proxyTable}>
            <thead>
              <tr>
                <th scope="col" style={{ width: '130px' }}>Timestamp (UTC)</th>
                <th scope="col" style={{ width: '65px' }}>Method</th>
                <th scope="col" style={{ width: '55px' }}>Status</th>
                <th scope="col">Destination URL / Host</th>
                <th scope="col" style={{ width: '110px' }}>Bytes Out / In</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const isSelected = entry.id === selectedEntryId;
                const isBigUpload = entry.bytesSent > 1000000;
                return (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedEntryId(entry.id)}
                    className={`${styles.proxyRow} ${isSelected ? styles.proxyRowSelected : ''}`}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedEntryId(entry.id);
                      }
                    }}
                  >
                    <td className={styles.bhTimeCell}>
                      {entry.timestamp.replace(' UTC', '')}
                    </td>
                    <td>
                      <span className={`${styles.proxyMethodTag} ${styles[`proxyMethod_${entry.method}`] || ''}`}>
                        {entry.method}
                      </span>
                    </td>
                    <td>
                      <span className={styles.proxyStatusTag}>{entry.statusCode}</span>
                    </td>
                    <td className={styles.bhTitleUrlCell}>
                      <span className={styles.bhTitleText}>{entry.host}</span>
                      <span className={styles.bhUrlText}>{entry.destinationUrl}</span>
                    </td>
                    <td className={styles.proxyBytesCell}>
                      <span className={isBigUpload ? styles.proxyBytesUploadAlert : ''}>
                        {isBigUpload ? `${(entry.bytesSent / 1000000).toFixed(1)} MB` : `${entry.bytesSent} B`}
                      </span>
                      {' / '}
                      <span>
                        {entry.bytesReceived > 1000000
                          ? `${(entry.bytesReceived / 1000000).toFixed(1)} MB`
                          : entry.bytesReceived > 1000
                          ? `${(entry.bytesReceived / 1000).toFixed(1)} KB`
                          : `${entry.bytesReceived} B`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.proxyInspectorColumn}>
          {selectedEntry ? (
            <div className={styles.proxyInspector}>
              <div className={styles.proxyInspectorHeader}>
                <div className={styles.bhInspectorTitleGroup}>
                  <span className={`${styles.proxyMethodTag} ${styles[`proxyMethod_${selectedEntry.method}`] || ''}`}>
                    {selectedEntry.method}
                  </span>
                  <span className={styles.proxyStatusTag}>HTTP {selectedEntry.statusCode}</span>
                </div>
                <span className={styles.proxyInspectorTitle}>{selectedEntry.id.toUpperCase()}</span>
              </div>

              <div className={styles.proxyInspectorUrl}>{selectedEntry.destinationUrl}</div>

              <div className={styles.bhMetaGrid}>
                <div className={styles.bhMetaItem}>
                  <span className={styles.bhMetaLabel}>Client IP &amp; Authenticated User</span>
                  <span className={styles.bhMetaValue}>
                    <code>{selectedEntry.clientIp}</code> ({selectedEntry.user})
                  </span>
                </div>
                <div className={styles.bhMetaItem}>
                  <span className={styles.bhMetaLabel}>Timestamp (NTP-Synchronized UTC)</span>
                  <span className={styles.bhMetaValue}><code>{selectedEntry.timestamp}</code></span>
                </div>
                <div className={styles.bhMetaItem}>
                  <span className={styles.bhMetaLabel}>Volumetrics (Data Exfiltration Indicator)</span>
                  <span className={styles.bhMetaValue}>
                    Bytes Sent: <strong style={{ color: selectedEntry.bytesSent > 1000000 ? '#fb7185' : 'inherit' }}>
                      {selectedEntry.bytesSent.toLocaleString()} bytes {selectedEntry.bytesSent > 1000000 ? `(${(selectedEntry.bytesSent / 1000000).toFixed(2)} MB)` : ''}
                    </strong>
                    <br />
                    Bytes Received: <strong>{selectedEntry.bytesReceived.toLocaleString()} bytes</strong>
                  </span>
                </div>
                <div className={styles.bhMetaItem}>
                  <span className={styles.bhMetaLabel}>Policy Category &amp; Latency</span>
                  <span className={styles.bhMetaValue}>
                    {selectedEntry.category} ({selectedEntry.durationMs} ms)
                  </span>
                </div>
              </div>

              {selectedEntry.notes && (
                <div className={selectedEntry.bytesSent > 1000000 ? styles.proxyAlertSection : styles.bhNoteSection}>
                  <div className={selectedEntry.bytesSent > 1000000 ? styles.proxyAlertHeader : styles.bhNoteHeader}>
                    {selectedEntry.bytesSent > 1000000 ? 'Exfiltration Volumetric Alert' : 'Gateway Observation'}
                  </div>
                  <div>{selectedEntry.notes}</div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.bhEmptyInspector}>
              <p>Select any proxy log row to inspect egress parameters and volumetrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SteganographyViewer: React.FC<{ content: StegoEvidenceContent }> = ({ content }) => {
  const exhibits = useMemo(() => content.exhibits || [], [content.exhibits]);
  const [selectedExhibitId, setSelectedExhibitId] = useState<string>(
    exhibits.length > 0 ? exhibits[0].id : ''
  );
  const [extractionMode, setExtractionMode] = useState<'rgb-lsb' | 'msb' | 'alpha-lsb'>('rgb-lsb');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [resultsByExhibit, setResultsByExhibit] = useState<Record<string, StegoExtractionResult>>({});
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  const selectedExhibit = useMemo(() => {
    return exhibits.find((e) => e.id === selectedExhibitId) || exhibits[0] || null;
  }, [exhibits, selectedExhibitId]);

  const activeResultKey = selectedExhibit ? `${selectedExhibit.id}_${extractionMode}` : '';
  const currentResult = resultsByExhibit[activeResultKey] || null;

  const handleRunExtraction = useCallback(() => {
    if (!selectedExhibit) return;
    setIsExtracting(true);
    setTimeout(() => {
      const res = extractLSBFromPngBytes(selectedExhibit.rawPngBytes, extractionMode);
      setResultsByExhibit((prev) => ({
        ...prev,
        [`${selectedExhibit.id}_${extractionMode}`]: res,
      }));
      setIsExtracting(false);
    }, 150);
  }, [selectedExhibit, extractionMode]);

  const handleCopyPayload = useCallback(() => {
    if (currentResult?.payloadText) {
      navigator.clipboard?.writeText(currentResult.payloadText).catch(() => {});
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  }, [currentResult]);

  return (
    <div className={styles.stegoWorkbench} role="region" aria-label="Steganography Evidence & Extraction Workbench">
      <div className={styles.stegoHeader}>
        <div className={styles.stegoHeaderLeft}>
          <ImageIcon size={22} className={styles.stegoIcon} aria-hidden="true" />
          <div>
            <h3 className={styles.stegoTitle}>Forensic Steganography Examination Workbench</h3>
            <p className={styles.stegoMeta}>
              <span>Case: <strong>{content.caseReference}</strong></span>
              <span className={styles.metaDivider}>•</span>
              <span>Exhibits: <strong>{exhibits.length} Lossless PNGs</strong></span>
              <span className={styles.metaDivider}>•</span>
              <span>Target Domain: <strong>Spatial Pixel LSB</strong></span>
            </p>
          </div>
        </div>
        <div className={styles.stegoCaseBadge}>{content.caseReference}</div>
      </div>

      {content.guidanceNote && (
        <div className={styles.stegoGuidanceCard}>
          <div className={styles.stegoGuidanceHeader}>
            <FileText size={15} aria-hidden="true" />
            <span>{content.guidanceNote.title}</span>
          </div>
          <ul className={styles.stegoGuidanceList}>
            {content.guidanceNote.rules.map((rule, idx) => (
              <li key={idx}>{rule}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Exhibit Cards */}
      <div className={styles.stegoExhibitGrid} role="tablist" aria-label="Evidence Image Exhibits">
        {exhibits.map((ex) => {
          const isSelected = ex.id === selectedExhibit?.id;
          const lsbResult = resultsByExhibit[`${ex.id}_rgb-lsb`];
          return (
            <button
              key={ex.id}
              role="tab"
              aria-selected={isSelected}
              className={`${styles.stegoCard} ${isSelected ? styles.stegoCardActive : ''}`}
              onClick={() => setSelectedExhibitId(ex.id)}
            >
              <img
                src={ex.dataUrl}
                alt={ex.filename}
                className={styles.stegoThumb}
                width={48}
                height={48}
              />
              <div className={styles.stegoCardInfo}>
                <span className={styles.stegoCardFilename}>{ex.filename}</span>
                <span className={styles.stegoCardMeta}>
                  {ex.dimensions.width}×{ex.dimensions.height} px • {(ex.fileSizeBytes / 1024).toFixed(1)} KB
                </span>
                {lsbResult && (
                  <span
                    className={`${styles.stegoCardBadge} ${
                      lsbResult.valid ? styles['stegoCardBadge--verified'] : styles['stegoCardBadge--none']
                    }`}
                  >
                    {lsbResult.valid ? '✓ Payload Verified' : 'No Payload'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Exhibit Details & Extraction Tool */}
      {selectedExhibit && (
        <div className={styles.stegoDetailSection}>
          {/* Left: Inspector */}
          <div className={styles.stegoInspectorPanel}>
            <div className={styles.stegoInspectorHeader}>
              <h4 className={styles.stegoInspectorTitle}>Exhibit Inspector: {selectedExhibit.filename}</h4>
              <span className={styles.bhCaseBadge}>PNG 8-bit RGBA</span>
            </div>

            <div className={styles.stegoZoomContainer}>
              <img
                src={selectedExhibit.dataUrl}
                alt={`Zoomed preview of ${selectedExhibit.filename}`}
                className={styles.stegoZoomImage}
                width={144}
                height={144}
              />
              <div className={styles.stegoZoomLegend}>
                <span>Preview: <strong>3× Pixel Zoom</strong></span>
                <span>Dimensions: <strong>{selectedExhibit.dimensions.width} × {selectedExhibit.dimensions.height}</strong></span>
                <span>Total Pixels: <strong>{selectedExhibit.dimensions.width * selectedExhibit.dimensions.height}</strong></span>
                <span>LSB Capacity: <strong>{selectedExhibit.dimensions.width * selectedExhibit.dimensions.height * 3} bits</strong></span>
              </div>
            </div>

            <div className={styles.stegoPropList}>
              <div className={styles.stegoPropRow}>
                <span className={styles.stegoPropKey}>Filename:</span>
                <span className={styles.stegoPropVal}>{selectedExhibit.filename}</span>
              </div>
              <div className={styles.stegoPropRow}>
                <span className={styles.stegoPropKey}>File Size:</span>
                <span className={styles.stegoPropVal}>{selectedExhibit.fileSizeBytes.toLocaleString()} bytes</span>
              </div>
              <div className={styles.stegoPropRow}>
                <span className={styles.stegoPropKey}>SHA-256 Hash:</span>
                <span className={styles.stegoPropVal}>{selectedExhibit.sha256}</span>
              </div>
              <div className={styles.stegoPropRow}>
                <span className={styles.stegoPropKey}>Acquisition Provenance:</span>
                <span className={styles.stegoPropVal}>{selectedExhibit.acquisitionSource}</span>
              </div>
              <div className={styles.stegoPropRow}>
                <span className={styles.stegoPropKey}>Case Notes:</span>
                <span className={styles.stegoPropVal}>{selectedExhibit.notes}</span>
              </div>
            </div>
          </div>

          {/* Right: Extraction Tool */}
          <div className={styles.stegoToolPanel}>
            <div className={styles.stegoInspectorHeader}>
              <h4 className={styles.stegoInspectorTitle}>Forensic Bitplane Extraction Tool</h4>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>SOP FOR-204</span>
            </div>

            <div className={styles.stegoToolControls}>
              <div className={styles.stegoModeSelector}>
                <label htmlFor="stego-mode-select" className={styles.stegoModeLabel}>
                  Extraction Method / Target Plane:
                </label>
                <select
                  id="stego-mode-select"
                  className={styles.stegoSelect}
                  value={extractionMode}
                  onChange={(e) => setExtractionMode(e.target.value as 'rgb-lsb' | 'msb' | 'alpha-lsb')}
                >
                  <option value="rgb-lsb">Sequential RGB Least-Significant-Bit (LSB) — Standard</option>
                  <option value="msb">Bitplane 7 / MSB (High-Order Plane)</option>
                  <option value="alpha-lsb">Alpha Channel LSB (Transparency Plane)</option>
                </select>
              </div>

              <button
                type="button"
                className={styles.stegoExtractBtn}
                onClick={handleRunExtraction}
                disabled={isExtracting}
                aria-label={`Run forensic extraction on ${selectedExhibit.filename}`}
              >
                {isExtracting ? 'Analyzing Raster Bitplanes...' : `Run Forensic Extraction (${selectedExhibit.filename})`}
              </button>
            </div>

            {/* Results Console */}
            {currentResult ? (
              <div
                className={`${styles.stegoResultCard} ${
                  currentResult.valid ? styles['stegoResultCard--success'] : styles['stegoResultCard--failure']
                }`}
              >
                <div
                  className={`${styles.stegoResultStatus} ${
                    currentResult.valid ? styles['stegoResultStatus--success'] : styles['stegoResultStatus--failure']
                  }`}
                >
                  {currentResult.valid ? (
                    <>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>Payload Verified ({currentResult.bytesExtracted} bytes)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} aria-hidden="true" />
                      <span>No Valid Payload Detected</span>
                    </>
                  )}
                </div>

                <p className={styles.stegoDiagnostics}>{currentResult.diagnostics}</p>

                {currentResult.payloadText && (
                  <div className={styles.stegoPayloadBox}>
                    <div className={styles.stegoPayloadHeader}>
                      <span>Decoded Plaintext Payload:</span>
                      <button
                        type="button"
                        className={styles.stegoCopyBtn}
                        onClick={handleCopyPayload}
                        aria-label="Copy recovered payload to clipboard"
                      >
                        {copiedPayload ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                        {copiedPayload ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className={styles.stegoPayloadText}>{currentResult.payloadText}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.bhEmptyInspector} style={{ minHeight: '140px' }}>
                <p>
                  Select an extraction method and click <strong>Run Forensic Extraction</strong> to read and decode
                  the raw raster scanlines of <code>{selectedExhibit.filename}</code>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PasswordAuditViewer: React.FC<{ content: PasswordAuditContent }> = ({ content }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [exposureFilter, setExposureFilter] = useState<'all' | 'exposed' | 'clean'>('all');
  const [privilegeFilter, setPrivilegeFilter] = useState<string>('all');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [revealAll, setRevealAll] = useState(false);

  const togglePassword = (accId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [accId]: !prev[accId],
    }));
  };

  const handleToggleRevealAll = () => {
    const next = !revealAll;
    setRevealAll(next);
    const updated: Record<string, boolean> = {};
    content.accounts.forEach((acc) => {
      updated[acc.id] = next;
    });
    setRevealedPasswords(updated);
  };

  const filteredAccounts = useMemo(() => {
    return content.accounts.filter((acc) => {
      if (exposureFilter === 'exposed' && !acc.breachStatus.isExposed) return false;
      if (exposureFilter === 'clean' && acc.breachStatus.isExposed) return false;
      if (privilegeFilter !== 'all' && acc.privilegeLevel !== privilegeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = acc.serviceName.toLowerCase().includes(q);
        const matchesUser = acc.username.toLowerCase().includes(q);
        const matchesRole = acc.roleDescription.toLowerCase().includes(q);
        if (!matchesName && !matchesUser && !matchesRole) return false;
      }
      return true;
    });
  }, [content.accounts, exposureFilter, privilegeFilter, searchTerm]);

  return (
    <div className={styles.paContainer} role="region" aria-label="Credential Audit Ledger">
      {/* Header */}
      <div className={styles.paHeader}>
        <div className={styles.paHeaderTop}>
          <div className={styles.paTitleRow}>
            <KeyRound size={18} color="#38bdf8" aria-hidden="true" />
            <h3 className={styles.paTitle}>{content.title}</h3>
          </div>
          <div className={styles.paMetaRow}>
            <span className={styles.paMetaItem}>
              Target: <strong>{content.targetUser.name}</strong> ({content.targetUser.title})
            </span>
            <span className={styles.paMetaItem}>
              Dept: <strong>{content.targetUser.department}</strong>
            </span>
            <span className={styles.paMetaItem}>
              Audit Date: <strong>{content.auditDate}</strong>
            </span>
          </div>
        </div>
        <p className={styles.paOverview}>{content.overviewSummary}</p>
      </div>

      {/* Toolbar */}
      <div className={styles.paToolbar}>
        <div className={styles.paSearchGroup}>
          <Search size={14} color="#94a3b8" aria-hidden="true" />
          <input
            type="text"
            className={styles.paSearchInput}
            placeholder="Search accounts or roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search credential audit accounts"
          />
        </div>

        <div className={styles.paFilterGroup}>
          <button
            type="button"
            className={`${styles.paFilterBtn} ${exposureFilter === 'all' ? styles['paFilterBtn--active'] : ''}`}
            onClick={() => setExposureFilter('all')}
          >
            All ({content.accounts.length})
          </button>
          <button
            type="button"
            className={`${styles.paFilterBtn} ${exposureFilter === 'exposed' ? styles['paFilterBtn--active'] : ''}`}
            onClick={() => setExposureFilter('exposed')}
          >
            Exposed ({content.accounts.filter((a) => a.breachStatus.isExposed).length})
          </button>
          <button
            type="button"
            className={`${styles.paFilterBtn} ${exposureFilter === 'clean' ? styles['paFilterBtn--active'] : ''}`}
            onClick={() => setExposureFilter('clean')}
          >
            Clean ({content.accounts.filter((a) => !a.breachStatus.isExposed).length})
          </button>

          <select
            className={styles.paFilterBtn}
            value={privilegeFilter}
            onChange={(e) => setPrivilegeFilter(e.target.value)}
            aria-label="Filter by privilege level"
          >
            <option value="all">All Privileges</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            type="button"
            className={styles.paGlobalToggleBtn}
            onClick={handleToggleRevealAll}
            aria-label={revealAll ? 'Mask all passwords' : 'Reveal all passwords'}
          >
            {revealAll ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
            <span>{revealAll ? 'Mask All' : 'Reveal All'}</span>
          </button>
        </div>
      </div>

      {/* Account Cards */}
      <div className={styles.paAccountGrid}>
        {filteredAccounts.map((acc) => {
          const isRevealed = Boolean(revealedPasswords[acc.id] ?? revealAll);
          const isAtRisk = acc.requiresRemediation;

          return (
            <div
              key={acc.id}
              className={`${styles.paAccountCard} ${
                isAtRisk ? styles['paAccountCard--atRisk'] : styles['paAccountCard--safe']
              }`}
            >
              {/* Card Top */}
              <div className={styles.paCardHeader}>
                <div className={styles.paServiceInfo}>
                  <span className={styles.paServiceName}>{acc.serviceName}</span>
                  <span className={styles.paRoleDesc}>{acc.roleDescription}</span>
                </div>
                <div className={styles.paBadgesTop}>
                  <span
                    className={`${styles.paPrivilegeBadge} ${
                      styles[`paPrivilegeBadge--${acc.privilegeLevel}`]
                    }`}
                  >
                    {acc.privilegeLevel} Privilege
                  </span>
                  {acc.reuseLink?.isReused && (
                    <span className={`${styles.paIndicator} ${styles['paIndicator--reuse']}`}>
                      Reused with {acc.reuseLink.reusedWithServiceName}
                    </span>
                  )}
                </div>
              </div>

              {/* Credential Row */}
              <div className={styles.paCredentialRow}>
                <div className={styles.paUserAndPass}>
                  <span className={styles.paUsernameTag}>User: {acc.username}</span>
                  <div className={styles.paPassBox}>
                    <span>{isRevealed ? acc.passwordDisplay : '••••••••••••••••'}</span>
                    <button
                      type="button"
                      className={styles.paEyeBtn}
                      onClick={() => togglePassword(acc.id)}
                      aria-label={`${isRevealed ? 'Hide' : 'Show'} password for ${acc.serviceName}`}
                      title={isRevealed ? 'Mask password' : 'Show password'}
                    >
                      {isRevealed ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
                    </button>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>({acc.passwordLength} chars)</span>
                  </div>
                </div>
                <span className={styles.paCharPattern}>{acc.passwordPattern}</span>
              </div>

              {/* Status Indicators */}
              <div className={styles.paStatusIndicators}>
                {/* Breach Status */}
                {acc.breachStatus.isExposed ? (
                  <span className={`${styles.paIndicator} ${styles['paIndicator--exposed']}`}>
                    <AlertCircle size={13} aria-hidden="true" />
                    <span>Exposed: {acc.breachStatus.breachSource ?? 'Public Breach Dumps'}</span>
                  </span>
                ) : (
                  <span className={`${styles.paIndicator} ${styles['paIndicator--clean']}`}>
                    <CheckCircle2 size={13} aria-hidden="true" />
                    <span>0 Breach Matches</span>
                  </span>
                )}

                {/* MFA Status */}
                {acc.mfaStatus.type === 'none' ? (
                  <span className={`${styles.paIndicator} ${styles['paIndicator--mfaNone']}`}>
                    <AlertCircle size={13} aria-hidden="true" />
                    <span>MFA Disabled</span>
                  </span>
                ) : acc.mfaStatus.type === 'sms' ? (
                  <span className={`${styles.paIndicator} ${styles['paIndicator--mfaSms']}`}>
                    <ShieldAlert size={13} aria-hidden="true" />
                    <span>MFA: SMS OTP (Weak)</span>
                  </span>
                ) : (
                  <span className={`${styles.paIndicator} ${styles['paIndicator--mfaStrong']}`}>
                    <ShieldCheck size={13} aria-hidden="true" />
                    <span>MFA: {acc.mfaStatus.label}</span>
                  </span>
                )}
              </div>

              {/* Notes & Context */}
              <div className={styles.paNotesSection}>
                <div>
                  <strong>Audit Findings: </strong>
                  <span>{acc.remediationReason}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Last Changed: {acc.lastChangedDate} | {acc.notes}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AuthTimelineViewer: React.FC<{ content: AuthTimelineContent }> = ({ content }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = useMemo(() => {
    return content.events.filter((ev) => {
      if (filterType === 'logins' && ev.eventType !== 'legitimate_login' && ev.eventType !== 'logout') return false;
      if (filterType === 'push' && !ev.eventType.startsWith('push_')) return false;
      if (filterType === 'unfamiliar' && !ev.sourceIp.startsWith('203.0.113')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${ev.timestamp} ${ev.serviceName} ${ev.sourceIp} ${ev.location} ${ev.device} ${ev.status} ${ev.details}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [content.events, filterType, searchQuery]);

  return (
    <div className={styles.mfaLogContainer} role="region" aria-label="Authentication and MFA Event Log">
      {/* Header Info */}
      <div className={styles.mfaLogHeader}>
        <div className={styles.mfaLogHeaderTop}>
          <div className={styles.mfaLogTitleRow}>
            <Activity size={18} style={{ color: '#38bdf8' }} aria-hidden="true" />
            <h4 className={styles.mfaLogTitle}>Corporate Identity Provider (IdP) — Unified Access & MFA Audit Log</h4>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            Audit Date: {content.auditDate}
          </span>
        </div>
        <div className={styles.mfaLogMeta}>
          <span><strong>User:</strong> {content.targetUser.name} ({content.targetUser.email})</span>
          <span><strong>Role:</strong> {content.targetUser.title}</span>
          <span><strong>Dept:</strong> {content.targetUser.department}</span>
          <span><strong>Office:</strong> {content.targetUser.officeLocation}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.mfaLogToolbar}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Events (${content.events.length})` },
            { id: 'logins', label: 'Logins / Sessions' },
            { id: 'push', label: 'Push Prompts' },
            { id: 'unfamiliar', label: 'External IP (203.0.113.88)' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id)}
              style={{
                fontSize: '11.5px',
                padding: '4px 10px',
                borderRadius: '4px',
                border: filterType === f.id ? '1px solid #38bdf8' : '1px solid #334155',
                background: filterType === f.id ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
                color: filterType === f.id ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: filterType === f.id ? 600 : 400,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Search size={14} style={{ color: '#64748b' }} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search events, IPs, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: '#020617',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: '#f8fafc',
              fontSize: '11.5px',
              padding: '4px 8px',
              width: '200px',
            }}
            aria-label="Filter authentication events"
          />
        </div>
      </div>

      {/* Events List */}
      <div className={styles.mfaTimelineList} role="feed" aria-label="Chronological Event List">
        {filteredEvents.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
            No authentication events match the selected filter.
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const badgeClass =
              ev.eventType === 'legitimate_login'
                ? styles['mfaTypeBadge--legit']
                : ev.eventType === 'logout'
                ? styles['mfaTypeBadge--logout']
                : ev.eventType === 'push_denied'
                ? styles['mfaTypeBadge--pushDenied']
                : ev.eventType === 'push_timeout'
                ? styles['mfaTypeBadge--pushTimeout']
                : ev.eventType === 'push_dispatched'
                ? styles['mfaTypeBadge--pushDispatched']
                : ev.eventType === 'sms_social_engineering'
                ? styles['mfaTypeBadge--sms']
                : styles['mfaTypeBadge--alert'];

            return (
              <div
                key={ev.id}
                className={styles.mfaTimelineItem}
                tabIndex={0}
                role="article"
                aria-label={`${ev.timestamp}: ${ev.eventType} for ${ev.serviceName} from ${ev.location}`}
              >
                <div className={styles.mfaItemTopRow}>
                  <div className={styles.mfaItemTimeAndType}>
                    <span className={styles.mfaItemTimestamp}>{ev.timestamp}</span>
                    <span className={`${styles.mfaTypeBadge} ${badgeClass}`}>
                      {ev.eventType.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                    {ev.serviceName}
                  </span>
                </div>

                <div className={styles.mfaItemDetails}>
                  {ev.details}
                </div>

                <div className={styles.mfaItemMetaRow}>
                  <span><strong>IP:</strong> {ev.sourceIp} ({ev.location})</span>
                  <span><strong>Device:</strong> {ev.device}</span>
                  <span><strong>Status:</strong> {ev.status}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const PushSimulatorViewer: React.FC<{ content: PushSimulatorContent }> = ({ content }) => {
  const [simFeedback, setSimFeedback] = useState<'denied' | 'approved' | null>(null);

  return (
    <div className={styles.pushSimContainer} role="region" aria-label="Simulated Mobile Authenticator Device">
      <div className={styles.pushPhoneMockup}>
        {/* Phone Status Bar */}
        <div className={styles.pushPhoneStatusBar}>
          <span>Apex Mobile 5G</span>
          <span style={{ fontWeight: 700 }}>23:47 UTC</span>
          <span>⚡ 84%</span>
        </div>

        {/* Device Alert Banner */}
        <div className={styles.pushBombingAlertBanner}>
          <Bell size={16} aria-hidden="true" />
          <span>{content.unsolicitedCount} Unsolicited Push Prompts Detected in 5 Minutes</span>
        </div>

        {/* Active Push Prompt Card */}
        <div className={styles.pushCard} role="alert" aria-live="polite">
          <div className={styles.pushCardHeader}>
            <span className={styles.pushAppTitle}>
              <Smartphone size={15} aria-hidden="true" />
              {content.appName}
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {content.activePrompt.timestamp}
            </span>
          </div>

          <h5 className={styles.pushPromptQuestion}>
            Approve sign-in request for {content.activePrompt.service}?
          </h5>

          <div className={styles.pushDetailsGrid}>
            <div className={styles.pushDetailRow}>
              <span className={styles.pushDetailKey}>Target Service:</span>
              <span className={styles.pushDetailVal}>{content.activePrompt.service}</span>
            </div>
            <div className={styles.pushDetailRow}>
              <span className={styles.pushDetailKey}>Account:</span>
              <span className={styles.pushDetailVal}>{content.activePrompt.account}</span>
            </div>
            <div className={styles.pushDetailRow}>
              <span className={styles.pushDetailKey}>Location Estimate:</span>
              <span className={`${styles.pushDetailVal} ${styles['pushDetailVal--warn']}`}>
                {content.activePrompt.location}
              </span>
            </div>
            <div className={styles.pushDetailRow}>
              <span className={styles.pushDetailKey}>Requesting IP:</span>
              <span className={styles.pushDetailVal}>{content.activePrompt.ipAddress}</span>
            </div>
            <div className={styles.pushDetailRow}>
              <span className={styles.pushDetailKey}>Client Device:</span>
              <span className={styles.pushDetailVal}>{content.activePrompt.deviceInfo}</span>
            </div>
          </div>

          {/* Interactive Simulation Buttons */}
          <div className={styles.pushActionButtons}>
            <button
              type="button"
              className={styles.pushBtnDeny}
              onClick={() => setSimFeedback('denied')}
              aria-label="Simulate Denying MFA Prompt"
            >
              ❌ Deny &amp; Report
            </button>
            <button
              type="button"
              className={styles.pushBtnApprove}
              onClick={() => setSimFeedback('approved')}
              aria-label="Simulate Approving MFA Prompt"
            >
              ✅ Approve
            </button>
          </div>

          {simFeedback === 'denied' && (
            <div className={`${styles.pushActionFeedback} ${styles['pushActionFeedback--denied']}`} role="status">
              <strong>Simulated Action: Rejected!</strong> In real life, denying unsolicited pushes stops the login attempt and alerts security. However, repeated prompts prove the attacker already holds your password—credential reset and session revocation are mandatory.
            </div>
          )}

          {simFeedback === 'approved' && (
            <div className={`${styles.pushActionFeedback} ${styles['pushActionFeedback--approved']}`} role="alert">
              <strong>Simulated Action: Compromised!</strong> Approving an unsolicited push completes MFA for the attacker, granting them full access to enterprise sessions and cloud resources!
            </div>
          )}
        </div>

        {/* Incoming SMS Message */}
        <div className={styles.pushSmsBubble}>
          <div className={styles.pushSmsHeader}>
            <span>💬 Incoming SMS • {content.recentSms.sender}</span>
            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>{content.recentSms.receivedTime}</span>
          </div>
          <p className={styles.pushSmsText}>
            {content.recentSms.messageText}
          </p>
          <span className={styles.pushSmsWarning}>
            ⚠️ Suspicious message urging push approval. Verify through official internal IT channels before taking action.
          </span>
        </div>

        {/* Device Information Footer */}
        <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
            Registered Device Details
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div><strong>Device:</strong> {content.deviceModel}</div>
            <div><strong>Recipient Line:</strong> {content.recipientPhone}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EvidenceViewer: React.FC<{ item: EvidenceItem }> = ({ item }) => {
  if (item.type === 'email') {
    const raw = item.content as Record<string, unknown>;
    if (raw?.isInbox || Array.isArray(raw?.emails)) {
      return <InboxViewer content={raw as unknown as InboxContent} />;
    }
    if (raw?.isThread || Array.isArray(raw?.messages)) {
      return <EmailThreadViewer content={raw as unknown as ThreadContent} />;
    }
    return <EmailViewer content={item.content as unknown as EmailContent} />;
  }
  if (item.type === 'image') {
    const raw = item.content as Record<string, unknown>;
    if (raw?.isStegoEvidence || Array.isArray(raw?.exhibits)) {
      return <SteganographyViewer content={raw as unknown as StegoEvidenceContent} />;
    }
  }
  if (item.type === 'file') {
    const raw = item.content as Record<string, unknown>;
    if (raw?.isPushSimulator) {
      return <PushSimulatorViewer content={raw as unknown as PushSimulatorContent} />;
    }
    if (raw?.isPasswordAudit || Array.isArray(raw?.accounts)) {
      return <PasswordAuditViewer content={raw as unknown as PasswordAuditContent} />;
    }
    if (raw?.isStegoEvidence || Array.isArray(raw?.exhibits)) {
      return <SteganographyViewer content={raw as unknown as StegoEvidenceContent} />;
    }
    if (raw?.isBrowserHistory || Array.isArray(raw?.records)) {
      return <BrowserHistoryViewer content={raw as unknown as BrowserHistoryContent} />;
    }
    if (raw?.isFileSystem || Array.isArray(raw?.files)) {
      return <FileSystemViewer content={raw as unknown as FileSystemContent} />;
    }
    if (raw?.type === 'directory') {
      return <CompanyDirectoryViewer content={raw as unknown as DirectoryContent} />;
    }
    if (raw?.rules && Array.isArray(raw.rules)) {
      return <PolicyDocumentViewer content={raw as unknown as PolicyDocumentContent} />;
    }
  }
  if (item.type === 'policy') {
    const raw = item.content as Record<string, unknown>;
    if (raw?.rules && Array.isArray(raw.rules)) {
      return <PolicyDocumentViewer content={raw as unknown as PolicyDocumentContent} />;
    }
  }
  if (item.type === 'network' || item.type === 'network-packet') {
    const raw = item.content as Record<string, unknown>;
    if (raw?.isPacketTrace || Array.isArray(raw?.packets)) {
      return <PacketTraceViewer content={raw as unknown as PacketTraceContent} />;
    }
    if (raw?.isFirewallPolicy || Array.isArray(raw?.rulesTable)) {
      return <FirewallRuleViewer content={raw as unknown as FirewallPolicyContent} />;
    }
    return <ExposureReportViewer content={raw as unknown as ExposureReportContent} />;
  }
  if (item.type === 'log') {
    const raw = item.content as Record<string, unknown>;
    if (raw?.isAuthTimeline) {
      return <AuthTimelineViewer content={raw as unknown as AuthTimelineContent} />;
    }
    if (raw?.isProxyLog || Array.isArray(raw?.entries)) {
      return <ProxyLogViewer content={raw as unknown as ProxyLogContent} />;
    }
    if (raw?.isAlertQueue || Array.isArray(raw?.alerts)) {
      return <AlertViewer content={raw as unknown as AlertQueueContent} />;
    }
    if (raw?.isTimeline || Array.isArray(raw?.events)) {
      return <TimelineViewer content={raw as unknown as TimelineContent} />;
    }
    return <LogViewer content={item.content as unknown as LogContent} />;
  }
  return (
    <div style={{ padding: 'var(--space-4)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
      {JSON.stringify(item.content, null, 2)}
    </div>
  );
};

// ── Interaction Widgets ───────────────────────────────────────────────────────

const FlagSelection: React.FC<{
  step: Step;
  value: Record<string, boolean>;
  onChange: (v: Record<string, boolean>) => void;
  submitted: boolean;
}> = ({ step, value, onChange, submitted }) => (
  <div className={styles.flagList} role="group" aria-label={step.prompt}>
    {step.items.map((item) => {
      const checked = Boolean(value[item.id]);
      return (
        <label
          key={item.id}
          className={`${styles.flagItem} ${checked ? styles['flagItem--checked'] : ''}`}
          aria-label={item.label}
        >
          <input
            type="checkbox"
            className={styles.flagCheckbox}
            checked={checked}
            disabled={submitted}
            onChange={(e) => onChange({ ...value, [item.id]: e.target.checked })}
            id={`flag-${item.id}`}
          />
          <span className={styles.flagLabel}>{item.label}</span>
        </label>
      );
    })}
  </div>
);

const MultiChoice: React.FC<{
  step: Step;
  value: string[];
  onChange: (v: string[]) => void;
  submitted: boolean;
}> = ({ step, value, onChange, submitted }) => {
  const currentSet = new Set(Array.isArray(value) ? value : []);
  const toggle = (id: string) => {
    if (submitted) return;
    const next = new Set(currentSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(Array.from(next));
  };

  return (
    <div className={styles.flagList} role="group" aria-label={step.prompt}>
      {step.items.map((item) => {
        const checked = currentSet.has(item.id);
        return (
          <label
            key={item.id}
            className={`${styles.flagItem} ${checked ? styles['flagItem--checked'] : ''}`}
            aria-label={item.label}
          >
            <input
              type="checkbox"
              className={styles.flagCheckbox}
              checked={checked}
              disabled={submitted}
              onChange={() => toggle(item.id)}
              id={`multichoice-${step.id}-${item.id}`}
            />
            <span className={styles.flagLabel}>{item.label}</span>
          </label>
        );
      })}
    </div>
  );
};

const SingleChoice: React.FC<{
  step: Step;
  value: string;
  onChange: (v: string) => void;
  submitted: boolean;
}> = ({ step, value, onChange, submitted }) => (
  <div className={styles.choiceList} role="radiogroup" aria-label={step.prompt}>
    {step.items.map((item) => {
      const selected = value === item.id;
      return (
        <label
          key={item.id}
          className={`${styles.choiceItem} ${selected ? styles['choiceItem--selected'] : ''}`}
          aria-label={item.label}
        >
          <input
            type="radio"
            name={`choice-${step.id}`}
            className={styles.choiceRadio}
            value={item.id}
            checked={selected}
            disabled={submitted}
            onChange={() => onChange(item.id)}
            id={`choice-${item.id}`}
          />
          <span className={styles.choiceLabel}>{item.label}</span>
        </label>
      );
    })}
  </div>
);

const Classification: React.FC<{
  step: Step;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  submitted: boolean;
}> = ({ step, value, onChange, submitted }) => (
  <div className={styles.classifyList} role="group" aria-label={step.prompt}>
    {step.items.map((item) => (
      <div key={item.id} className={styles.classifyItem}>
        <span className={styles.classifyItemLabel}>{item.label}</span>
        <select
          className={styles.classifySelect}
          value={value[item.id] ?? ''}
          disabled={submitted}
          aria-label={`Classification for: ${item.label}`}
          onChange={(e) => onChange({ ...value, [item.id]: e.target.value })}
        >
          <option value="" disabled>Select…</option>
          {(item.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    ))}
  </div>
);

const Ordering: React.FC<{
  step: Step;
  value: string[];
  onChange: (v: string[]) => void;
  submitted: boolean;
}> = ({ step, value, onChange, submitted }) => {
  const currentOrder = useMemo(() => {
    if (Array.isArray(value) && value.length === step.items.length) {
      return value;
    }
    return step.items.map((i) => i.id);
  }, [value, step.items]);

  const itemMap = useMemo(() => {
    const map = new Map<string, Step['items'][0]>();
    for (const item of step.items) map.set(item.id, item);
    return map;
  }, [step.items]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (submitted) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;
    const newOrder = [...currentOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    onChange(newOrder);
  };

  return (
    <div className={styles.orderList} role="list" aria-label={step.prompt}>
      {currentOrder.map((itemId, idx) => {
        const item = itemMap.get(itemId);
        if (!item) return null;
        return (
          <div
            key={itemId}
            className={styles.orderItem}
            role="listitem"
            aria-label={`Position ${idx + 1}: ${item.label}`}
          >
            <div className={styles.orderPositionBadge} aria-hidden="true">
              {idx + 1}
            </div>
            <div className={styles.orderItemContent}>
              <span className={styles.orderItemLabel}>{item.label}</span>
            </div>
            <div className={styles.orderActions}>
              <button
                type="button"
                className={styles.orderBtn}
                disabled={submitted || idx === 0}
                aria-label={`Move item ${idx + 1} up to position ${idx}`}
                onClick={() => moveItem(idx, 'up')}
              >
                <ChevronUp size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.orderBtn}
                disabled={submitted || idx === currentOrder.length - 1}
                aria-label={`Move item ${idx + 1} down to position ${idx + 2}`}
                onClick={() => moveItem(idx, 'down')}
              >
                <ChevronDown size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const GuidedForm: React.FC<{
  step: Step;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  submitted: boolean;
}> = ({ step, value, onChange, submitted }) => (
  <div className={styles.guidedFormList} role="group" aria-label={step.prompt}>
    {step.items.map((item) => (
      <div key={item.id} className={styles.guidedFormField}>
        <label htmlFor={`field-${item.id}`} className={styles.guidedFormLabel}>
          {item.label}
        </label>
        <select
          id={`field-${item.id}`}
          className={styles.classifySelect}
          value={value[item.id] ?? ''}
          disabled={submitted}
          aria-label={item.label}
          onChange={(e) => onChange({ ...value, [item.id]: e.target.value })}
        >
          <option value="" disabled>Select {item.label.toLowerCase()}…</option>
          {(item.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    ))}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

type StepState = Record<string, StepResponse['submitted']>;

export const ChallengePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { progress, recordAttempt } = useCyberStore();

  const challenge = id ? getChallenge(id) : undefined;

  // ── Local state ──
  const [activeEvidence, setActiveEvidence] = useState(0);
  const [stepState, setStepState] = useState<StepState>(() => {
    const initial: StepState = {};
    if (!challenge) return initial;
    for (const step of challenge.steps) {
      if (step.interaction === 'flag-selection') {
        initial[step.id] = {};
      } else if (step.interaction === 'single-choice') {
        initial[step.id] = '';
      } else if (step.interaction === 'classification' || step.interaction === 'guided-form') {
        initial[step.id] = {};
      } else if (step.interaction === 'ordering' || step.interaction === 'ranking') {
        initial[step.id] = step.items.map((i) => i.id);
      } else if (step.interaction === 'multi-choice') {
        initial[step.id] = [];
      } else {
        initial[step.id] = '';
      }
    }
    return initial;
  });
  const [hintsUsed, setHintsUsed] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submitting = useRef(false); // prevent duplicate submission

  const totalHints = challenge?.hints.length ?? 0;
  const handleRevealHint = useCallback(() => {
    setHintsUsed((n) => Math.min(n + 1, totalHints));
  }, [totalHints]);

  if (!challenge) return <NotFoundPage />;

  // Determine retry number
  const pastAttempts = progress.attempts.filter((a) => a.challengeId === challenge.id);
  const retryNumber = pastAttempts.length;

  const difficulty = challenge.difficulty;
  const diffLabel = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }[difficulty];

  // ── Handlers ──

  const handleStepChange = (stepId: string, value: StepResponse['submitted']) => {
    setStepState((prev) => ({ ...prev, [stepId]: value }));
    setValidationError('');
  };

  const validate = (): boolean => {
    for (const step of challenge.steps) {
      const val = stepState[step.id];
      if (step.interaction === 'single-choice' && !val) {
        setValidationError(`Please select an option for step ${challenge.steps.indexOf(step) + 1}.`);
        return false;
      }
      if (step.interaction === 'multi-choice') {
        const arr = (val as string[]) || [];
        if (arr.length === 0) {
          setValidationError(`Please select at least one option for step ${challenge.steps.indexOf(step) + 1}.`);
          return false;
        }
      }
      if (step.interaction === 'classification') {
        const classVal = (val as Record<string, string>) || {};
        const unset = step.items.some((item) => !classVal[item.id]);
        if (unset) {
          setValidationError(`Please classify all items in step ${challenge.steps.indexOf(step) + 1}.`);
          return false;
        }
      }
      if (step.interaction === 'guided-form') {
        const formVal = (val as Record<string, string>) || {};
        const unset = step.items.some((item) => !formVal[item.id]);
        if (unset) {
          setValidationError(`Please configure all fields in step ${challenge.steps.indexOf(step) + 1}.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (submitting.current || isSubmitted) return;
    if (!validate()) return;

    submitting.current = true;
    setIsSubmitted(true);

    const stepResponses = buildStepResponses(challenge.steps, stepState);
    const attempt = recordAttempt(challenge, stepResponses, hintsUsed, retryNumber);

    navigate(`/results/${attempt.id}`, { replace: false });
  };

  // ── Evidence icon map ──
  const evidenceIcons: React.ReactNode[] = challenge.evidence.map((ev) => {
    if (ev.type === 'email') {
      const raw = ev.content as Record<string, unknown>;
      if (raw?.isInbox || Array.isArray(raw?.emails)) {
        return <Inbox size={14} aria-hidden="true" />;
      }
      if (raw?.isThread || Array.isArray(raw?.messages)) {
        return <MessageSquare size={14} aria-hidden="true" />;
      }
      return <Mail size={14} aria-hidden="true" />;
    }
    if (ev.type === 'image') return <ImageIcon size={14} aria-hidden="true" />;
    if (ev.type === 'policy' || ev.type === 'file') {
      const raw = ev.content as Record<string, unknown>;
      if (raw?.isPushSimulator) return <Smartphone size={14} aria-hidden="true" />;
      if (raw?.isBrowserHistory) return <Globe size={14} aria-hidden="true" />;
      if (raw?.isStegoEvidence) return <ImageIcon size={14} aria-hidden="true" />;
      if (raw?.isPasswordAudit) return <KeyRound size={14} aria-hidden="true" />;
      return <Building2 size={14} aria-hidden="true" />;
    }
    if (ev.type === 'network' || ev.type === 'network-packet') return <Network size={14} aria-hidden="true" />;
    if (ev.type === 'log') {
      const raw = ev.content as Record<string, unknown>;
      if (raw?.isAuthTimeline) return <Activity size={14} aria-hidden="true" />;
      if (raw?.isProxyLog) return <Network size={14} aria-hidden="true" />;
      if (raw?.isAlertQueue || Array.isArray(raw?.alerts)) {
        return <ShieldAlert size={14} aria-hidden="true" />;
      }
      if (raw?.isTimeline || Array.isArray(raw?.events)) {
        return <Activity size={14} aria-hidden="true" />;
      }
      return <FileText size={14} aria-hidden="true" />;
    }
    return <FileText size={14} aria-hidden="true" />;
  });

  const room = getRoom(challenge.roomId);

  return (
    <div className={`${styles.page} ${room?.accentClass ?? 'room-phishing'}`}>
      <div className={styles.content}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <Link to={`/room/${challenge.roomId}`} className={styles.backLink}>
            <ArrowLeft size={15} aria-hidden="true" />
            {room?.title ?? challenge.roomId}
          </Link>
          <div className={styles.topMeta}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)', padding: '3px var(--space-3)',
            }}>
              {challenge.id}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: 'var(--text-xs)', fontWeight: 600,
              padding: '3px var(--space-2)', borderRadius: 'var(--radius-full)',
              background: difficulty === 'beginner' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
              color: difficulty === 'beginner' ? '#22c55e' : '#f59e0b',
              border: difficulty === 'beginner' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(245,158,11,0.3)',
            }}>
              {diffLabel}
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>{challenge.title}</h1>

        {/* Briefing */}
        <div className={styles.briefing} role="region" aria-label="Scenario briefing">
          <p className={styles.briefingLabel}>Scenario</p>
          <p className={styles.briefingText}>{challenge.briefing}</p>
        </div>

        {/* Two-column workspace */}
        <div className={styles.workspace}>
          {/* ── Left: Evidence ── */}
          <section className={styles.evidencePanel} aria-label="Evidence">
            <p className={styles.panelTitle}>Evidence</p>

            {/* Evidence tabs */}
            <div className={styles.evidenceTabs} role="tablist" aria-label="Evidence tabs">
              {challenge.evidence.map((ev, i) => (
                <button
                  key={ev.id}
                  role="tab"
                  aria-selected={i === activeEvidence}
                  aria-controls={`evidence-panel-${i}`}
                  id={`evidence-tab-${i}`}
                  className={`${styles.evidenceTab} ${i === activeEvidence ? styles['evidenceTab--active'] : ''}`}
                  onClick={() => setActiveEvidence(i)}
                >
                  {evidenceIcons[i]}
                  {ev.label}
                </button>
              ))}
            </div>

            {/* Active evidence */}
            {challenge.evidence.map((ev, i) => (
              <div
                key={ev.id}
                id={`evidence-panel-${i}`}
                role="tabpanel"
                aria-labelledby={`evidence-tab-${i}`}
                hidden={i !== activeEvidence}
              >
                <EvidenceViewer item={ev} />
              </div>
            ))}
          </section>

          {/* ── Right: Decision panel ── */}
          <aside className={styles.decisionPanel} aria-label="Decisions">
            {/* Steps */}
            {challenge.steps.map((step, stepIndex) => (
              <div key={step.id} className={styles.stepCard}>
                <div className={styles.stepHeader}>
                  <div className={styles.stepHeaderLeft}>
                    <span className={styles.stepNum} aria-hidden="true">{stepIndex + 1}</span>
                    <span className={styles.stepLabel}>Step {stepIndex + 1}</span>
                  </div>
                  <span className={styles.pointBadge}>{step.pointValue} pts</span>
                </div>
                <div className={styles.stepBody}>
                  <p className={styles.stepPrompt}>{step.prompt}</p>

                  {step.interaction === 'flag-selection' && (
                    <FlagSelection
                      step={step}
                      value={stepState[step.id] as Record<string, boolean> ?? {}}
                      onChange={(v) => handleStepChange(step.id, v)}
                      submitted={isSubmitted}
                    />
                  )}
                  {step.interaction === 'single-choice' && (
                    <SingleChoice
                      step={step}
                      value={stepState[step.id] as string ?? ''}
                      onChange={(v) => handleStepChange(step.id, v)}
                      submitted={isSubmitted}
                    />
                  )}
                  {step.interaction === 'multi-choice' && (
                    <MultiChoice
                      step={step}
                      value={(stepState[step.id] as string[]) || []}
                      onChange={(v) => handleStepChange(step.id, v)}
                      submitted={isSubmitted}
                    />
                  )}
                  {step.interaction === 'classification' && (
                    <Classification
                      step={step}
                      value={stepState[step.id] as Record<string, string> ?? {}}
                      onChange={(v) => handleStepChange(step.id, v)}
                      submitted={isSubmitted}
                    />
                  )}
                  {(step.interaction === 'ordering' || step.interaction === 'ranking') && (
                    <Ordering
                      step={step}
                      value={(stepState[step.id] as string[]) || step.items.map((i) => i.id)}
                      onChange={(v) => handleStepChange(step.id, v)}
                      submitted={isSubmitted}
                    />
                  )}
                  {step.interaction === 'guided-form' && (
                    <GuidedForm
                      step={step}
                      value={stepState[step.id] as Record<string, string> ?? {}}
                      onChange={(v) => handleStepChange(step.id, v)}
                      submitted={isSubmitted}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Hints */}
            <HintDrawer
              hints={challenge.hints}
              revealedCount={hintsUsed}
              onRevealHint={handleRevealHint}
            />

            {/* Submit */}
            <div className={styles.submitArea}>
              {validationError && (
                <div className={styles.validationError} role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  {validationError}
                </div>
              )}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleSubmit}
                disabled={isSubmitted}
                aria-label="Submit your answers"
                id="submit-challenge"
              >
                {isSubmitted ? 'Submitting…' : 'Submit Answers'}
              </Button>
            </div>

            <p className={styles.disclaimer}>
              All evidence is entirely fictional. This is a learning simulation only.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
};
