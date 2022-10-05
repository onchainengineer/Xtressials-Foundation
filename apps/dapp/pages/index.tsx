// GNU AFFERO GENERAL PUBLIC LICENSE Version 3. Copyright (C) 2022 DAO DAO Contributors.
// See the "LICENSE" file in the root directory of this package for more copyright information.

import { ArrowNarrowRightIcon } from '@heroicons/react/solid'
import type { GetStaticProps, NextPage } from 'next'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SuspenseLoader } from '@dao-dao/common'
import { serverSideTranslations } from '@dao-dao/i18n/serverSideTranslations'
import { ArrowUpRight } from '@dao-dao/icons'
import { usePinnedDaos } from '@dao-dao/state'
import { DaoCardInfo } from '@dao-dao/tstypes/dao'
import {
  Button,
  FeaturedDaos,
  GradientWrapper,
  Logo,
  PageLoader,
  RotatableLogo,
} from '@dao-dao/ui'
import { FEATURED_DAOS_CACHE_SECONDS } from '@dao-dao/utils'

import {
  AnouncementCard,
  EnterAppButton,
  HomepageCards
} from '@/components'
import { getFeaturedDaos } from '@/server'

interface HomePageProps {
  featuredDaos: DaoCardInfo[]
}

const Home: NextPage<HomePageProps> = ({ featuredDaos }) => {
  const { t } = useTranslation()
  const { isPinned, setPinned, setUnpinned } = usePinnedDaos()

  const [tvl, setTVL] = useState<number>()
  const [daos, setDaos] = useState<number>()
  const [proposals, setProposals] = useState<number>()

  useEffect(() => {
    fetch('https://dao-stats.withoutdoing.com/mainnet/balances.json')
      .then((response) => response.json())
      .then((data) => setTVL(data[data.length - 1].value))
    fetch('https://dao-stats.withoutdoing.com/mainnet/count.json')
      .then((response) => response.json())
      .then((data) => setDaos(data[data.length - 1].value))
    fetch('https://dao-stats.withoutdoing.com/mainnet/proposals.json')
      .then((response) => response.json())
      .then((data) => setProposals(data[data.length - 1].value))
  }, [])

  return (
    <SuspenseLoader fallback={<PageLoader className="w-screen h-screen" />}>
      <GradientWrapper>
        <nav className="py-4 px-6 w-full bg-clip-padding bg-opacity-40 border-b border-inactive backdrop-blur-xl backdrop-filter">
          <div className="flex justify-between items-center mx-auto max-w-screen-lg">
            <Link href="/" passHref>
              <a className="flex items-center">
                <div className="mr-3">
                  <Logo size={32} />
                </div>
                <p className="mr-1 font-medium">Xtressials Foundation</p>
                <p
                  className="font-semibold text-secondary"
                  style={{ transform: 'scaleY(1) scaleX(1)' }}
                >                  
                </p>
              </a>
            </Link>
            <div className="flex gap-4 items-center">
              <a
                className="flex gap-2 items-center"
                href="https://docs.onchain.engineer"
              >
                {t('splash.documentation')}
                <ArrowUpRight height="10px" width="10px" />
              </a>
              <div className="hidden md:block">
                <EnterAppButton small />
              </div>
            </div>
          </div>
        </nav>
        <h1 className="mt-16 text-center md:mt-[33vh] hero-text">
          {t('splash.shortTagline')}
        </h1>
        <p className="px-4 my-10 mx-auto max-w-lg text-lg text-center text-secondary">
          {t('splash.longTagline')}
        </p>
        <div className="mx-auto">
          <EnterAppButton />
        </div>
        <div className="my-12 mx-auto md:my-20">
          <AnouncementCard />
        </div>

        <FeaturedDaos
          featuredDaos={featuredDaos}
          isDaoPinned={isPinned}
          onPin={(coreAddress) =>
            isPinned(coreAddress)
              ? setUnpinned(coreAddress)
              : setPinned(coreAddress)
          }
        />

        <div className="px-3 -mt-8">
          <div className="flex flex-col gap-4 items-center my-12">
          </div>
          <div className="grid grid-cols-1 gap-2 my-10 font-mono md:grid-cols-3 caption-text">
          </div>
        </div>
      </GradientWrapper>
    </SuspenseLoader>
  )
}

export default Home

export const getStaticProps: GetStaticProps<HomePageProps> = async ({
  locale,
}) => ({
  props: {
    ...(await serverSideTranslations(locale, ['translation'])),
    featuredDaos: await getFeaturedDaos(),
    revalidate: FEATURED_DAOS_CACHE_SECONDS,
  },
})
