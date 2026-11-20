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
  Bike,
  BadgeCheck,
  MoveRight,
  PhoneCall,
  FileCheck2,
  Wallet,
} from 'lucide-react';

const steps = [
  { number: '01', title: '견적 상담 신청', description: '연락처와 차량 정보를 간단히 남겨주세요.' },
  { number: '02', title: '매입 조건 상담', description: '차량 정보를 바탕으로 매입 조건을 안내합니다.' },
  { number: '03', title: '차량 및 서류 확인', description: '실제 차량 상태와 거래 관련 서류를 확인합니다.' },
  { number: '04', title: '계약 및 대금 정산', description: '최종 조건에 합의하면 계약과 정산을 진행합니다.' },
];

const faqs = [
  { question: '매입 견적 상담은 무료인가요?', answer: '네. 초기 매입 상담은 무료입니다. 실제 매입 조건은 차량 상태와 서류 확인 후 협의합니다.' },
  { question: '사고나 수리 이력이 있는 차량도 가능한가요?', answer: '상담 가능합니다. 사고 및 수리 이력과 현재 차량 상태에 따라 매입 가능 여부와 조건이 달라질 수 있습니다.' },
  { question: '할부가 남아 있는 오토바이도 상담할 수 있나요?', answer: '상담 가능합니다. 다만 잔여 할부금과 차량 권리관계를 확인한 뒤 거래 가능 여부를 안내합니다.' },
  { question: '매입 대금은 언제 받을 수 있나요?', answer: '차량 확인, 계약 체결, 권리관계 정리 및 인수 조건에 따라 지급 시점을 협의합니다.' },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="heySite" id="top">
      <header className="heyHeader">
        <div className="heyContainer heyNav">
          <a href="#top" className="heyBrand" onClick={closeMenu} aria-label="HEYBIKE 홈">
            <span className="heyBrandSymbol">H.</span>
            <span>HEYBIKE</span>
          </a>
          <nav className={menuOpen ? 'heyLinks open' : 'heyLinks'} aria-label="주요 메뉴">
            <a href="#why" onClick={closeMenu}>헤이바이크 소개</a>
            <a href="#process" onClick={closeMenu}>매입 절차</a>
            <a href="#faq" onClick={closeMenu}>자주 묻는 질문</a>
            <a className="heyNavCta" href="#estimateForm" onClick={closeMenu}>
              무료 견적 상담 <ArrowUpRight size={17} />
            </a>
          </nav>
          <button className="heyMenuButton" type="button" aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={25} /> : <Menu size={25} />}
          </button>
        </div>
      </header>

      <section className="heyHero" id="estimate">
        <div className="heyContainer heyHeroGrid">
          <div className="heyHeroCopy">
            <div className="heyEyebrow"><span className="heyPulse" /> HEYBIKE MOTORCYCLE BUYBACK</div>
            <h1>내 오토바이,<br /><span>얼마에 팔 수 있을까요?</span></h1>
            <p className="heyHeroDescription">
              PCX부터 NMAX까지, 내 바이크의 매입 조건이 궁금하다면?<br />
              복잡한 절차 없이 헤이바이크에서 상담을 시작하세요.
            </p>
            <div className="heyHeroActions">
              <a href="#estimateForm" className="heyPrimaryButton">무료 견적 상담하기 <ArrowUpRight size={20} /></a>
              <a href="#process" className="heySecondaryButton">매입 절차 확인 <MoveRight size={19} /></a>
            </div>
            <div className="heyTrustLine">
              <span><Check size={17} /> 무료 상담</span>
              <span><Check size={17} /> 간편한 정보 입력</span>
              <span><Check size={17} /> 조건 확인 후 협의</span>
            </div>
            <div className="heyHeroArtwork" aria-label="HEYBIKE 오토바이 매입 상담 안내">
              <span className="heyArtworkWord" aria-hidden="true">HEY.</span>
              <Bike size={116} strokeWidth={1.15} aria-hidden="true" />
              <span className="heyArtworkCaption">YOUR BIKE, YOUR VALUE</span>
            </div>
          </div>

          <div className="heyFormShell" id="estimateForm">
            <div className="heyFormTop">
              <span className="heyFormLabel">FREE BUYBACK CONSULTATION</span>
              <h2>오토바이<br />무료 매입 견적 상담</h2>
              <p>고객명과 연락처, 차량 정보를 입력하면 매입 조건 상담을 진행할 수 있습니다.</p>
            </div>
            <InquiryForm />
          </div>
        </div>
      </section>

      <section className="heyHighlights" id="why">
        <div className="heyContainer">
          <div className="heySectionHeading">
            <span className="heySectionTag">WHY HEYBIKE</span>
            <h2>바이크 매입 상담,<br /><span>더 간편하게 시작하세요.</span></h2>
          </div>
          <div className="heyHighlightsGrid">
            <article className="heyHighlightCard">
              <div className="heyHighlightIcon"><MessagesSquare size={27} /></div>
              <h3>부담 없는 무료 상담</h3>
              <p>차량 판매를 결정하기 전에도 매입 조건에 관해 상담할 수 있습니다.</p>
              <span>01 / FREE CONSULTATION</span>
            </article>
            <article className="heyHighlightCard">
              <div className="heyHighlightIcon"><ClipboardList size={27} /></div>
              <h3>필요한 정보만 간단히</h3>
              <p>고객명, 연락처, 제조사, 모델명, 소재지 등 기본 정보로 시작합니다.</p>
              <span>02 / SIMPLE REQUEST</span>
            </article>
            <article className="heyHighlightCard">
              <div className="heyHighlightIcon"><ShieldCheck size={27} /></div>
              <h3>차량 확인 후 조건 협의</h3>
              <p>차량 상태와 서류를 확인하고 최종 매입 조건을 협의합니다.</p>
              <span>03 / CLEAR PROCESS</span>
            </article>
          </div>
        </div>
      </section>

      <section className="heyProcess" id="process">
        <div className="heyContainer">
          <div className="heyProcessHeading">
            <div><span className="heySectionTag">HOW IT WORKS</span><h2>매입 상담부터 정산까지<br />단 4단계로 안내합니다.</h2></div>
            <p>거래 조건은 차량 확인 및 당사자 간 협의를 거쳐 확정됩니다.</p>
          </div>
          <div className="heySteps">
            {steps.map((step) => (
              <article className="heyStep" key={step.number}>
                <span className="heyStepNumber">{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.description}</p></div>
                <ArrowUpRight size={23} aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="heyBanner">
        <div className="heyContainer heyBannerInner">
          <div><span>HEYBIKE / BUYBACK CONSULTATION</span><h2>바이크 판매를 고민 중이라면,<br />매입 상담부터 시작하세요.</h2></div>
          <a href="#estimateForm" className="heyBannerButton">무료 견적 상담 <ArrowRight size={20} /></a>
        </div>
      </section>

      <section className="heyFaq" id="faq">
        <div className="heyContainer heyFaqGrid">
          <div><span className="heySectionTag">FAQ</span><h2>자주 묻는<br />질문</h2><p className="heyFaqDescription">매입 상담 전 궁금한 내용을 확인해 보세요.</p></div>
          <div className="heyFaqList">
            {faqs.map((faq, index) => (
              <div className="heyFaqItem" key={faq.question}>
                <button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                  <span>{faq.question}</span>
                  <ChevronDown size={21} className={openFaq === index ? 'active' : ''} />
                </button>
                {openFaq === index && <p>{faq.answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="heyFinalCta">
        <div className="heyContainer heyFinalInner">
          <BadgeCheck size={40} aria-hidden="true" />
          <h2>내 바이크의 매입 조건,<br />HEYBIKE에서 확인하세요.</h2>
          <a href="#estimateForm" className="heyPrimaryButton">견적 상담 신청 <ArrowUpRight size={20} /></a>
        </div>
      </section>

      <footer className="heyFooter">
        <div className="heyContainer">
          <div className="heyFooterTop">
            <a href="#top" className="heyBrand"><span className="heyBrandSymbol">H.</span><span>HEYBIKE</span></a>
            <div className="heyFooterLinks">
              <a href="#why">서비스 소개</a>
              <a href="#process">매입 절차</a>
              <a href="#estimateForm">견적 상담</a>
              <a href="/privacy">개인정보 처리방침</a>
            </div>
          </div>
          <p className="heyFooterNotice">운영 사업자 정보는 확정 후 안내됩니다. 현재 온라인 견적 접수는 준비 중입니다.</p>
          <div className="heyCopyright">© {new Date().getFullYear()} HEYBIKE. ALL RIGHTS RESERVED.</div>
        </div>
      </footer>
    </main>
  );
}
