
'use client';

import { useState } from 'react';
import InquiryForm from './inquiry-form';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  ClipboardList,
  MessagesSquare,
  BadgeCheck,
  MoveRight,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    title: '견적 신청',
    description: '간단한 차량 정보와 연락처를 남겨주세요.',
  },
  {
    number: '02',
    title: '상담 및 조건 안내',
    description: '차량 정보를 확인하고 매입 조건을 협의합니다.',
  },
  {
    number: '03',
    title: '차량 확인',
    description: '차량 상태와 관련 서류를 확인합니다.',
  },
  {
    number: '04',
    title: '계약 및 정산',
    description: '최종 조건에 합의한 후 계약과 정산을 진행합니다.',
  },
];

const faqs = [
  {
    question: '견적 상담은 무료인가요?',
    answer:
      '네. 초기 매입 상담은 무료입니다. 최종 매입 조건은 차량 상태와 서류 확인 후 협의합니다.',
  },
  {
    question: '사고 이력이 있는 차량도 상담 가능한가요?',
    answer:
      '네. 사고 및 수리 이력이 있는 차량도 상담할 수 있습니다. 차량 상태에 따라 매입 가능 여부와 조건이 달라질 수 있습니다.',
  },
  {
    question: '할부가 남아 있어도 신청할 수 있나요?',
    answer:
      '신청 가능합니다. 다만 할부 잔액과 권리관계 확인 후 거래 가능 여부를 안내합니다.',
  },
  {
    question: '매입 대금은 언제 지급되나요?',
    answer:
      '차량 검수와 계약 체결, 권리관계 정리 및 차량 인수 조건에 따라 지급 시점을 협의합니다.',
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="heySite" id="top">
      <header className="heyHeader">
        <div className="heyContainer heyNav">
          <a
            href="#top"
            className="heyBrand"
            onClick={closeMenu}
            aria-label="헤이바이크 홈"
          >
            <span className="heyBrandSymbol">H.</span>
            <span>HEYBIKE</span>
          </a>

          <nav className={menuOpen ? 'heyLinks open' : 'heyLinks'}>
            <a href="#why" onClick={closeMenu}>
              헤이바이크 소개
            </a>
            <a href="#process" onClick={closeMenu}>
              매입 절차
            </a>
            <a href="#faq" onClick={closeMenu}>
              자주 묻는 질문
            </a>
            <a
              className="heyNavCta"
              href="#estimateForm"
              onClick={closeMenu}
            >
              무료 견적 상담
              <ArrowUpRight size={17} />
            </a>
          </nav>

          <button
            className="heyMenuButton"
            type="button"
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={25} /> : <Menu size={25} />}
          </button>
        </div>
      </header>

      <section className="heyHero" id="estimate">
        <div className="heyContainer heyHeroGrid">
          <div className="heyHeroCopy">
            <div className="heyEyebrow">
              <span className="heyPulse" />
              HEYBIKE MOTORCYCLE BUYBACK
            </div>

            <h1>
              내 오토바이,
              <br />
              <span>얼마에 팔 수</span>
              <br />
              <span>있을까요?</span>
            </h1>

            <p className="heyHeroDescription">
              PCX부터 스포츠바이크까지,
              내 바이크의 매입 조건이 궁금하다면?
              <br />
              복잡한 절차 없이 헤이바이크에서 상담을 시작하세요.
            </p>

            <div className="heyHeroActions">
              <a href="#estimateForm" className="heyPrimaryButton">
                무료 견적 상담하기
                <ArrowUpRight size={20} />
              </a>
              <a href="#process" className="heySecondaryButton">
                매입 절차 확인
                <MoveRight size={19} />
              </a>
            </div>

            <div className="heyTrustLine">
              <span>
                <Check size={17} /> 무료 상담
              </span>
              <span>
                <Check size={17} /> 간편한 정보 입력
              </span>
              <span>
                <Check size={17} /> 조건 확인 후 협의
              </span>
            </div>

            <div className="heyHeroArtwork heySportbikeArtwork">
              <img
                src="/heybike-premium-scooter.png"
                alt="HEYBIKE 스포츠바이크 홍보 이미지"
                className="heySportbikeImage"
              />
              <span className="heySportbikeCaption">
                HEYBIKE · YOUR BIKE, YOUR VALUE
              </span>
            </div>
          </div>

          <div className="heyFormShell" id="estimateForm">
            <div className="heyFormTop">
              <span className="heyFormLabel">
                FREE BUYBACK CONSULTATION
              </span>
              <h2>
                오토바이
                <br />
                무료 매입 견적 상담
              </h2>
              <p>
                고객명과 연락처, 차량 정보를 입력하면
                매입 조건 상담을 진행할 수 있습니다.
              </p>
            </div>
            <InquiryForm />
          </div>
        </div>
      </section>

      <section className="heyHighlights" id="why">
        <div className="heyContainer">
          <div className="heySectionHeading">
            <span className="heySectionTag">WHY HEYBIKE</span>
            <h2>
              바이크 거래의 시작을
              <br />
              <span>더 쉽고 명확하게.</span>
            </h2>
          </div>

          <div className="heyHighlightsGrid">
            <article className="heyHighlightCard">
              <div className="heyHighlightIcon">
                <MessagesSquare size={27} />
              </div>
              <h3>무료 매입 상담</h3>
              <p>
                부담 없이 차량 정보를 남기고
                매입 상담을 받아보세요.
              </p>
              <span>01 / CONSULTATION</span>
            </article>

            <article className="heyHighlightCard">
              <div className="heyHighlightIcon">
                <ClipboardList size={27} />
              </div>
              <h3>간편한 신청</h3>
              <p>
                복잡한 입력 없이 필요한
                정보만으로 상담을 시작합니다.
              </p>
              <span>02 / SIMPLE PROCESS</span>
            </article>

            <article className="heyHighlightCard">
              <div className="heyHighlightIcon">
                <ShieldCheck size={27} />
              </div>
              <h3>투명한 조건 협의</h3>
              <p>
                차량 상태와 관련 서류를
                확인하고 조건을 안내합니다.
              </p>
              <span>03 / TRANSPARENCY</span>
            </article>
          </div>
        </div>
      </section>

      <section className="heyProcess" id="process">
        <div className="heyContainer">
          <div className="heyProcessHeading">
            <div>
              <span className="heySectionTag">HOW IT WORKS</span>
              <h2>
                매입 절차는
                <br />
                단 4단계.
              </h2>
            </div>
            <p>
              신청부터 거래 완료까지,
              <br />
              단계별로 안내합니다.
            </p>
          </div>

          <div className="heySteps">
            {steps.map((step) => (
              <article className="heyStep" key={step.number}>
                <span className="heyStepNumber">
                  {step.number}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <ArrowUpRight size={23} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="heyBanner">
        <div className="heyContainer heyBannerInner">
          <div>
            <span>HEYBIKE / MOTORCYCLE BUYBACK</span>
            <h2>
              판매를 고민하고 있다면,
              <br />
              상담부터 시작하세요.
            </h2>
          </div>
          <a href="#estimateForm" className="heyBannerButton">
            무료 견적 상담
            <ArrowRight size={20} />
          </a>
        </div>
      </section>

      <section className="heyFaq" id="faq">
        <div className="heyContainer heyFaqGrid">
          <div>
            <span className="heySectionTag">FAQ</span>
            <h2>
              자주 묻는
              <br />
              질문.
            </h2>
            <p className="heyFaqDescription">
              상담 전에 궁금한 내용을 확인하세요.
            </p>
          </div>

          <div className="heyFaqList">
            {faqs.map((faq, index) => (
              <div className="heyFaqItem" key={faq.question}>
                <button
                  type="button"
                  aria-expanded={openFaq === index}
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    size={21}
                    className={
                      openFaq === index ? 'active' : ''
                    }
                  />
                </button>
                {openFaq === index && <p>{faq.answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="heyFinalCta">
        <div className="heyContainer heyFinalInner">
          <BadgeCheck size={40} />
          <h2>
            내 바이크,
            <br />
            헤이바이크에서 상담하세요.
          </h2>
          <a href="#estimateForm" className="heyPrimaryButton">
            견적 상담하기
            <ArrowUpRight size={20} />
          </a>
        </div>
      </section>

      <footer className="heyFooter">
        <div className="heyContainer">
          <div className="heyFooterTop">
            <a href="#top" className="heyBrand">
              <span className="heyBrandSymbol">H.</span>
              <span>HEYBIKE</span>
            </a>
            <div className="heyFooterLinks">
              <a href="#why">서비스 소개</a>
              <a href="#process">매입 절차</a>
              <a href="#estimateForm">견적 상담</a>
              <a href="/privacy">개인정보 처리방침</a>
            </div>
          </div>
          <p className="heyFooterNotice">
            운영 사업자 정보는 확정 후 안내됩니다.
            현재 온라인 견적 접수는 준비 중입니다.
          </p>
          <div className="heyCopyright">
            © {new Date().getFullYear()} HEYBIKE.
            ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </main>
  );
}
