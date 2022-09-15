import { Check, Close } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

import { ProcessedTQ, ProcessedTQType } from '@dao-dao/tstypes'
import { Progress, Tooltip, TooltipInfoIcon } from '@dao-dao/ui'
import { formatPercentOf100 } from '@dao-dao/utils'

export interface ProposalVoteTallyProps {
  threshold: ProcessedTQ
  quorum?: ProcessedTQ
  yesVotes: number
  noVotes: number
  abstainVotes: number
  totalVotingPower: number
  open: boolean
}

export const ProposalVoteTally = ({
  threshold,
  quorum,
  yesVotes,
  noVotes,
  abstainVotes,
  totalVotingPower,
  open,
}: ProposalVoteTallyProps) => {
  const { t } = useTranslation()

  const turnoutTotal = yesVotes + noVotes + abstainVotes
  const turnoutYesPercent = turnoutTotal ? (yesVotes / turnoutTotal) * 100 : 0
  const turnoutNoPercent = turnoutTotal ? (noVotes / turnoutTotal) * 100 : 0
  const turnoutAbstainPercent = turnoutTotal
    ? (abstainVotes / turnoutTotal) * 100
    : 0

  const turnoutPercent = (turnoutTotal / totalVotingPower) * 100
  const totalYesPercent = (yesVotes / totalVotingPower) * 100
  const totalNoPercent = (noVotes / totalVotingPower) * 100
  const totalAbstainPercent = (abstainVotes / totalVotingPower) * 100

  // When only abstain votes have been cast and there is no quorum,
  // align the abstain progress bar to the right to line up with Abstain
  // text.
  const onlyAbstain = yesVotes === 0 && noVotes === 0 && abstainVotes > 0

  const thresholdReached =
    !!threshold &&
    // All abstain fails, so we need at least 1 yes vote to reach threshold.
    yesVotes > 0 &&
    (threshold.type === ProcessedTQType.Majority
      ? // Majority
        yesVotes >
        ((quorum ? turnoutTotal : totalVotingPower) - abstainVotes) / 2
      : // Percent
        yesVotes >=
        ((quorum ? turnoutTotal : totalVotingPower) - abstainVotes) *
          (threshold.value /
            (threshold.type === ProcessedTQType.Percent ? 100 : 1)))
  const quorumMet =
    !!quorum &&
    (quorum.type === ProcessedTQType.Majority
      ? // Majority
        turnoutTotal > totalVotingPower / 2
      : // Percent
        turnoutPercent >= quorum.value)

  const effectiveYesPercent = quorum ? turnoutYesPercent : totalYesPercent
  const effectiveNoPercent = quorum ? turnoutNoPercent : totalNoPercent
  const effectiveAbstainPercent = quorum
    ? turnoutAbstainPercent
    : totalAbstainPercent

  // Convert various threshold types to a relevant percent to use in UI
  // elements.
  const effectiveThresholdValue =
    threshold.type === ProcessedTQType.Majority
      ? // If there are no abstain votes, this should be 50.
        // If there are 4% abstain votes, this should be 48, since 48%+1 of the 96% non-abstain votes need to be in favor.
        50 -
        (abstainVotes / 2 / ((quorum ? turnoutTotal : totalVotingPower) || 1)) *
          100
      : threshold.type === ProcessedTQType.Percent
      ? threshold.value
      : // If absolute, compute percent of total.
        (threshold.value / totalVotingPower) * 100
  // Quorum does not have an absolute setting.
  const effectiveQuorum = quorum && {
    display: quorum.display,
    value: quorum.type === ProcessedTQType.Majority ? 50 : quorum.value,
  }

  return (
    <div className="rounded-lg border bg-component-widget border-border-secondary">
      <div className="py-4 px-6 space-y-4">
        {/* Threshold title */}
        <p className="link-text text-text-body">
          {quorum ? t('title.ratioOfVotes') : t('title.turnout')}
        </p>

        {/* Vote percentage stats */}
        <div className="flex flex-row gap-4 items-center caption-text">
          {[
            <p key="yes" className="text-text-interactive-valid">
              {formatPercentOf100(effectiveYesPercent)} {t('info.yesVote')}
            </p>,
            <p key="no" className="text-text-interactive-error">
              {formatPercentOf100(effectiveNoPercent)} {t('info.noVote')}
            </p>,
          ]
            .sort(() => yesVotes - noVotes)
            .map((elem, idx) => (
              <div
                key={idx}
                className={idx === 0 && yesVotes !== noVotes ? 'flex-1' : ''}
              >
                {elem}
              </div>
            ))}
          <p
            className={`text-text-tertiary ${
              yesVotes === noVotes ? 'flex-1 text-right' : ''
            }`}
          >
            {formatPercentOf100(effectiveAbstainPercent)}{' '}
            {t('info.abstainVote')}
          </p>
        </div>

        {/* Threshold progress bar */}
        <div className="my-2">
          <Progress
            // If using an absolute threshold (i.e. no quorum) and there are
            // only abstain votes cast so far, align to the right.
            alignEnd={!quorum && onlyAbstain}
            caretPosition={effectiveThresholdValue}
            rows={[
              {
                thickness: 10,
                data: [
                  ...[
                    {
                      value: Number(effectiveYesPercent),
                      color: 'var(--icon-interactive-valid)',
                    },
                    {
                      value: Number(effectiveNoPercent),
                      color: 'var(--icon-interactive-error)',
                    },
                  ].sort((a, b) => b.value - a.value),
                  {
                    value: Number(effectiveAbstainPercent),
                    color: 'var(--icon-tertiary)',
                  },
                ],
              },
            ]}
          />
        </div>

        <div className="flex flex-row gap-2 justify-between items-center secondary-text">
          <div className="flex flex-row gap-1 items-center">
            <p className="text-text-tertiary">{t('title.passingThreshold')}</p>
            <TooltipInfoIcon
              iconClassName="text-icon-tertiary"
              size="sm"
              title={t('info.proposalThresholdTooltip')}
            />
          </div>

          {/* Threshold config display */}
          <p className="flex flex-row gap-1 items-center">
            <Tooltip title={t('info.proposalThresholdTooltip')}>
              <p className="text-text-body">{threshold.display}</p>
            </Tooltip>

            {/* A proposal will automatically close once no more votes can affect the outcome, not waiting for the expiration time. This means we can simply check if the proposal is open to know whether the threshold being reached indicates a final verdict or just the current state of the turnout. We could, more verbosely, always display the final verdict (reached/not met) when there is no quorum (i.e. if using an absolute threshold config), but once the final verdict is set, the status will change. Thus, we don't need to check if a quorum exists to choose this status indicator. */}
            {thresholdReached ? (
              <Tooltip title={open ? t('info.passing') : t('info.reached')}>
                <Check className="!w-5 !h-5 text-icon-primary" />
              </Tooltip>
            ) : (
              <Tooltip title={open ? t('info.failing') : t('info.notMet')}>
                <Close className="!w-5 !h-5 text-icon-primary" />
              </Tooltip>
            )}
          </p>
        </div>
      </div>

      {/* Quorum, if present */}
      {effectiveQuorum && (
        <div className="py-4 px-6 space-y-4 border-t border-border-secondary">
          {/* Quorum title */}
          <p className="link-text text-text-body">
            {t('title.percentTurnout', {
              value: formatPercentOf100(turnoutPercent),
            })}
          </p>

          {/* Quorum progress bar */}
          <div className="my-2">
            <Progress
              caretPosition={effectiveQuorum.value}
              rows={[
                {
                  thickness: 10,
                  data: [
                    {
                      value: Number(turnoutPercent),
                      color: 'var(--icon-secondary)',
                    },
                  ],
                },
              ]}
            />
          </div>

          {/* Quorum config display */}
          <div className="flex flex-row gap-2 justify-between items-center secondary-text">
            <div className="flex flex-row gap-1 items-center">
              <p className="text-text-tertiary">{t('title.quorum')}</p>
              <TooltipInfoIcon
                iconClassName="text-icon-tertiary"
                size="sm"
                title={t('info.proposalQuorumTooltip')}
              />
            </div>

            <p className="flex flex-row gap-1 items-center">
              <Tooltip title={t('info.proposalQuorumTooltip')}>
                <p className="text-text-body">{effectiveQuorum.display}</p>
              </Tooltip>

              {quorumMet ? (
                <Tooltip title={t('info.reached')}>
                  <Check className="!w-5 !h-5 text-icon-primary" />
                </Tooltip>
              ) : (
                <Tooltip title={t('info.notMet')}>
                  <Close className="!w-5 !h-5 text-icon-primary" />
                </Tooltip>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Provide clarification for what happens in the event of a tie when the threshold is exactly 50%. */}
      {
        // effectiveThresholdValue is set to 50 when the type is majority, but
        // there are no ties in the majority case, so we can ignore it.
        threshold.type !== ProcessedTQType.Majority &&
          effectiveThresholdValue === 50 &&
          turnoutTotal > 0 &&
          yesVotes === noVotes && (
            <div className="py-4 px-6 space-y-2 border-t border-border-secondary">
              <p className="secondary-text text-text-tertiary">
                {t('title.proposalTieClarification')}
              </p>

              <p className="body-text">
                {t('info.yesWillWinTieClarification')}
              </p>
            </div>
          )
      }

      {/* Provide clarification for what happens in the event that all voters abstain. */}
      {turnoutTotal > 0 && abstainVotes === turnoutTotal && (
        <div className="py-4 px-6 space-y-2 border-t border-border-secondary">
          <p className="secondary-text text-text-tertiary">
            {t('title.proposalAllAbstain')}
          </p>

          <p className="body-text">
            {t('info.proposalAllAbstainClarification')}
          </p>
        </div>
      )}
    </div>
  )
}
