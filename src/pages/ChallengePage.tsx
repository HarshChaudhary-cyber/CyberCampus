import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Mail, FileText, AlertCircle, Paperclip,
  MessageSquare, Building2, UserCheck, ShieldAlert,
  Inbox, ExternalLink, ShieldCheck, ChevronDown, ChevronUp, Activity, Network,
} from 'lucide-react';
import { useCyberStore } from '../store';
import { getChallenge, getRoom } from '../challenges';
import { buildStepResponses } from '../challenges/evaluator';
import { HintDrawer } from '../components/ui/HintDrawer';
import { Button } from '../components/ui/Button';
import { NotFoundPage } from './NotFoundPage';
import type { EvidenceItem, Step, StepResponse } from '../types';
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
  if (item.type === 'policy' || item.type === 'file') {
    const raw = item.content as Record<string, unknown>;
    if (raw?.type === 'directory') {
      return <CompanyDirectoryViewer content={raw as unknown as DirectoryContent} />;
    }
    if (raw?.rules && Array.isArray(raw.rules)) {
      return <PolicyDocumentViewer content={raw as unknown as PolicyDocumentContent} />;
    }
  }
  if (item.type === 'network') {
    const raw = item.content as Record<string, unknown>;
    if (raw?.isFirewallPolicy || Array.isArray(raw?.rulesTable)) {
      return <FirewallRuleViewer content={raw as unknown as FirewallPolicyContent} />;
    }
    return <ExposureReportViewer content={raw as unknown as ExposureReportContent} />;
  }
  if (item.type === 'log') {
    const raw = item.content as Record<string, unknown>;
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
    if (ev.type === 'policy' || ev.type === 'file') return <Building2 size={14} aria-hidden="true" />;
    if (ev.type === 'network') return <Network size={14} aria-hidden="true" />;
    if (ev.type === 'log') {
      const raw = ev.content as Record<string, unknown>;
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
