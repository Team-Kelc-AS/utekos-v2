import Image from 'next/image'
import Link from 'next/link'
import { Lock, MousePointer2, Send } from 'lucide-react'
import { BagOutlineIcon } from '@/components/utekos-icons/BagOutlineIcon'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Bubble, BubbleContent, BubbleReactions } from '@/components/ui/bubble'
import { Message, MessageContent, MessageFooter } from '@/components/ui/message'
import { googleSansFlex } from '@/lib/fonts'
import styles from './TrustSection.module.css'

function WindowDots() {
  return (
    <div className={styles.dots} aria-hidden>
      <span /><span /><span />
    </div>
  )
}

export function TrustSection() {
  return (
    <section
      aria-labelledby='trust-section-heading'
      className={`${googleSansFlex.variable} ${styles.section}`}
    >
      <div className={styles.panel}>
        <div className={styles.content}>
          <h2 id='trust-section-heading'>En opplevelse bygget på tillit</h2>
          <p className={styles.intro}>
            Fra du besøker siden vår til du nyter kveldssolen i ditt Utekos-plagg
            – vi er dedikerte til å levere en trygg og førsteklasses opplevelse i
            alle ledd.
          </p>

          <div className={styles.stack}>
            <Card className={`${styles.card} ${styles.shoppingCard}`}>
              <CardHeader className={styles.cardHeader}>
                <WindowDots />
                <div className={styles.cardContent}>
                  <span className={`${styles.icon} ${styles.shoppingIcon}`}>
                    <BagOutlineIcon tone='orange' size={22} />
                  </span>
                  <div>
                    <CardTitle><h3>En trygg handel</h3></CardTitle>
                    <CardDescription>
                      <p>Sikre betalingsløsninger og 14 dagers angrerett.</p>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className={`${styles.card} ${styles.privacyCard}`}>
              <CardHeader className={styles.cardHeader}>
                <WindowDots />
                <div className={styles.cardContent}>
                  <span className={styles.icon}>
                    <Lock size={22} aria-hidden />
                  </span>
                  <div>
                    <CardTitle><h3>Ditt personvern</h3></CardTitle>
                    <CardDescription>
                      <p>
                        Vi tar personvern på alvor. Se hvordan vi behandler dine
                        data i vår{' '}
                        <Link href='/personvern'>personvernserklæring</Link>.
                      </p>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className={styles.logoContainer}>
                <Image
                  src='/icon.png'
                  alt='Utekos'
                  width={48}
                  height={48}
                  className={styles.logo}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className={styles.chat} role='group' aria-label='Illustrert samtale om hytteturen'>
          <Message align='start' className={styles.incoming}>
            <MessageContent className={styles.messageContent}>
              <Bubble variant='outline' className={styles.bubble}>
                <BubbleContent className={styles.bubbleContent}>
                  <p>
                    <span className={styles.srOnly}>Hanne: </span>
                    Husk å pakke noe skikkelig varmt til kvelden på hytten, det blir
                    fort kaldt 🥶
                  </p>
                </BubbleContent>
              </Bubble>
              <MessageFooter className={styles.name} aria-hidden>
                <MousePointer2 size={20} fill='currentColor' /> Hanne
              </MessageFooter>
            </MessageContent>
          </Message>
          <Message align='end' className={styles.outgoing}>
            <MessageContent className={styles.messageContent}>
              <Bubble className={styles.bubble}>
                <BubbleContent className={styles.bubbleContent}>
                  <p>
                    <span className={styles.srOnly}>Thomas: </span>
                    Slapp av, jeg tar med Utekosen min. Den er alt vi trenger.
                  </p>
                </BubbleContent>
              </Bubble>
              <MessageFooter className={styles.name} aria-hidden>
                <MousePointer2 size={20} fill='currentColor' /> Thomas
              </MessageFooter>
            </MessageContent>
          </Message>
          <Message align='start' className={styles.incoming}>
            <MessageContent className={styles.messageContent}>
              <Bubble variant='outline' className={styles.bubble}>
                <BubbleContent className={styles.bubbleContent}>
                  <p>
                    <span className={styles.srOnly}>Hanne: </span>
                    Genialt! Da slipper vi å drasse med oss de gamle pleddene.
                  </p>
                </BubbleContent>
                <BubbleReactions className={styles.reaction} role='img' aria-label='Én liker-reaksjon'>
                  <span aria-hidden>👍 1</span>
                </BubbleReactions>
              </Bubble>
            </MessageContent>
          </Message>
          <Message align='end' className={styles.outgoing}>
            <MessageContent className={styles.messageContent}>
              <Bubble variant='outline' className={styles.bubble}>
                <BubbleContent className={`${styles.bubbleContent} ${styles.lastMessage}`}>
                  <p>
                    <span className={styles.srOnly}>Thomas: </span>
                    Nettopp. Mer plass til vinen{' '}
                    <span className={styles.cursorAnchor}>😉<span className={styles.cursor} aria-hidden /></span>
                  </p>
                  <Send size={20} aria-hidden />
                </BubbleContent>
              </Bubble>
              <MessageFooter className={styles.draftStatus}>Ikke sendt</MessageFooter>
            </MessageContent>
          </Message>
        </div>
      </div>
    </section>
  )
}
