
'use client';

import { useState } from 'react';
import InquiryForm from './inquiry-form';
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  ClipboardCheck,
  Truck,
  Wallet,
  Menu,
  X,
  ChevronDown,
  CheckCircle2,
  Phone,
  MapPin,
  Camera,
  Headphones,
  Handshake,
  FileCheck2
} from 'lucide-react';

const faqs = [
  {
    question: '견적 상담은 무료인가요?',
    answer:
      '네. 초기 매입 견적 상담은 무료입니다. 최종 매입 금액은 차량 상태와 서류 확인 후 협의합니다.'
  },
  {
    question: '사고나 수리 이력이 있어도 상담할 수 있나요?',
    answer:
      '네. 사고 및 수리 이력이 있는 오토바이도 상담 가능합니다. 차량 상태를 자세히 알려주시면 검토 후 안내합니다.'
  },
  {
    question: '할부가 남은 차량도 매입 가능한가요?',
    answer:
      '할부 잔액 및 권리관계 확인이 필요합니다. 정산 가능 여부와 거래 조건은 상담 후 안내합니다.'
  },
  {
    question: '언제 대금을 받을 수 있나요?',
    answer:
      '차량 검수, 계약 체결, 권리관계 정리 및 차량 인수 조건에 따라 지급 시점을 안내합니다.'
  }
];

const benefits = [
  {
    icon: Headphones,
    title: '무료 매입 상담',
    description: '부담 없이 상담하세요.'
  },
  {
    icon: Camera,
    title: '사진 첨부 가능',
    description: '차량 사진으로 간편하게 신청하세요.'
  },
  {
    icon: Handshake,
    title: '투명한 조건 협의',
    description: '차량 상태에 맞는 조건을 안내합니다.'
  },
  {
    icon: Truck,
    title: '차량 인수 상담',
    description: '차량 위치에 맞춰 인수 방법을 협의합니다.'
  }
];

const steps = [
  {
    number: '01',
    title: '무료 견적 신청',
    description: '고객 정보와 차량 정보 입력'
  },
  {
    number: '02',
    title: '매입 상담',
    description: '차량 상태와 매입 조건 협의'
  },
  {
    number: '03',
    title: '차량 확인',
    description: '실차 검수 및 관련 서류 확인'
  },
  {
    number: '04',
    title: '계약 및 정산',
    description: '최종 조건 합의 후 계약과 대금 지급'
  }
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="hbSite" id="top">
      {/* HEADER */}
      <header className="hbHeader">
        <div className="hbContainer hbNav">
          <a
            className="hbBrand"
            href="#top"
            onClick={closeMenu}
          >
            <span className="hbLogo">H</span>
            <span className="hbBrandName">
              하이바이크
              <small>HIGH BIKE</small>
            </span>
          </a>

          <nav className={menuOpen ? 'hbNavLinks open' : 'hbNavLinks'}>
            <a href="#advantages" onClick={closeMenu}>
              서비스 소개
            </a>
            <a href="#process" onClick={closeMenu}>
              매입 절차
            </a>
            <a href="#faq" onClick={closeMenu}>
              자주 묻는 질문
            </a>
            <a
              className="hbNavButton"
              href="#estimate"
              onClick={closeMenu}
            >
              무료 견적 신청
              <ArrowRight size={17} />
            </a>
          </nav>

          <button
            type="button"
            className="hbMenuButton"
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* MAIN: 오토바이 + 견적 신청서 한 화면 */}
      <section className="hbMainHero" id="estimate">
        <div className="hbContainer hbHeroGrid">

          {/* 왼쪽: 스포츠 오토바이 */}
          <div className="hbHeroVisual">
            <div className="hbHeroContent">
              <span className="hbEyebrow">
                PREMIUM MOTORCYCLE BUYING
              </span>

              <h1>
                내 바이크,
                <br />
                <span>그 가치를</span>
                <br />
                제대로 평가하다.
              </h1>

              <p className="hbHeroDescription">
                소중하게 관리해 온 당신의 모터사이클.
                <br />
                하이바이크에서 간편하게
                <br />
                매입 상담을 시작하세요.
              </p>

              <div className="hbHeroChecks">
                <span>
                  <CheckCircle2 size={19} />
                  무료 매입 상담
                </span>
                <span>
                  <Camera size={19} />
                  차량 사진 첨부 가능
                </span>
                <span>
                  <ShieldCheck size={19} />
                  투명한 거래 조건 협의
                </span>
              </div>
            </div>

            <div className="hbHeroPhoto" aria-hidden="true" />

            <div className="hbHeroSignature">
              <span>YOUR BIKE.</span>
              <strong>YOUR VALUE.</strong>
            </div>
          </div>

          {/* 오른쪽: 기존 접수 기능 그대로 유지 */}
          <div className="hbFormCard">
            <div className="hbFormHeading">
              <span className="hbFormEyebrow">
                HIGH BIKE CONSULTATION
              </span>

              <h2>무료 오토바이 매입 견적 신청</h2>

              <p>
                차량 정보를 남겨주시면 확인 후
                상담을 진행합니다.
              </p>
            </div>

            <InquiryForm />
          </div>
        </div>
      </section>

      {/* 핵심 장점 */}
      <section className="hbBenefits" id="advantages">
        <div className="hbContainer hbBenefitsGrid">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article className="hbBenefit" key={benefit.title}>
                <div className="hbBenefitIcon">
                  <Icon size={26} strokeWidth={1.8} />
                </div>

                <div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 서비스 소개 */}
      <section className="hbSection hbAbout">
        <div className="hbContainer hbAboutGrid">
          <div>
            <span className="hbSectionLabel">
              WHY HIGH BIKE
            </span>

            <h2>
              바이크 매각,
              <br />
              <span>복잡할 필요 없습니다.</span>
            </h2>

            <p>
              중고 오토바이 판매가 고민되시나요?
              하이바이크는 차량 정보 접수부터
              매입 조건 협의, 차량 검수와 계약까지
              단계별로 안내합니다.
            </p>

            <a className="hbTextLink" href="#estimate">
              지금 무료 견적 신청하기
              <ArrowUpRight size={19} />
            </a>
          </div>

          <div className="hbAboutCards">
            <article>
              <ClipboardCheck size={30} />
              <h3>간편한 온라인 신청</h3>
              <p>
                고객명, 연락처, 모델명만 필수로 입력하고
                상담을 신청할 수 있습니다.
              </p>
            </article>

            <article>
              <ShieldCheck size={30} />
              <h3>차량 상태별 상담</h3>
              <p>
                연식, 주행거리, 사고 및 수리 이력을
                고려해 거래 조건을 협의합니다.
              </p>
            </article>

            <article>
              <Truck size={30} />
              <h3>차량 인수 일정 협의</h3>
              <p>
                차량 위치와 거래 조건에 따라
                인수 방법과 일정을 안내합니다.
              </p>
            </article>

            <article>
              <Wallet size={30} />
              <h3>계약 후 대금 정산</h3>
              <p>
                최종 매입 조건에 합의한 뒤
                계약 및 대금 지급을 진행합니다.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 매입 절차 */}
      <section className="hbSection hbProcess" id="process">
        <div className="hbContainer">
          <div className="hbSectionHeading">
            <span className="hbSectionLabel">
              HOW IT WORKS
            </span>
            <h2>
              간단한 <span>4단계 매입 절차</span>
            </h2>
            <p>
              신청부터 거래 완료까지
              단계별로 안내합니다.
            </p>
          </div>

          <div className="hbSteps">
            {steps.map((step) => (
              <article className="hbStep" key={step.number}>
                <span className="hbStepNumber">
                  {step.number}
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="hbSection hbFaq" id="faq">
        <div className="hbContainer hbFaqGrid">
          <div className="hbFaqIntro">
            <span className="hbSectionLabel">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2>
              자주 묻는
              <br />
              <span>질문</span>
            </h2>
            <p>
              상담 전에 궁금한 내용을
              확인해 보세요.
            </p>
          </div>

          <div className="hbFaqList">
            {faqs.map((item, index) => (
              <div className="hbFaqItem" key={item.question}>
                <button
                  type="button"
                  aria-expanded={openFaq === index}
                  onClick={() =>
                    setOpenFaq(
                      openFaq === index ? null : index
                    )
                  }
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    size={20}
                    className={
                      openFaq === index ? 'active' : ''
                    }
                  />
                </button>

                {openFaq === index && (
                  <p>{item.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 하단 상담 유도 */}
      <section className="hbBottomCta">
        <div className="hbContainer hbBottomInner">
          <div>
            <span className="hbSectionLabel">
              START YOUR CONSULTATION
            </span>
            <h2>
              내 바이크의 매입 조건,
              <br />
              지금 확인해 보세요.
            </h2>
            <p>하이바이크 무료 매입 상담</p>
          </div>

          <a className="hbPrimaryButton" href="#estimate">
            무료 견적 신청하기
            <ArrowRight size={19} />
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="hbFooter">
        <div className="hbContainer">
          <div className="hbFooterTop">
            <a href="#top" className="hbBrand">
              <span className="hbLogo">H</span>
              <span className="hbBrandName">
                하이바이크
                <small>HIGH BIKE</small>
              </span>
            </a>

            <div className="hbFooterLinks">
              <a href="#advantages">서비스 소개</a>
              <a href="#process">매입 절차</a>
              <a href="#estimate">견적 신청</a>
              <a href="/privacy">개인정보 처리방침</a>
            </div>
          </div>

          <div className="hbFooterDetails">
            <p>상호: 하이바이크 | 개인사업자</p>

            <p>
              <MapPin size={15} />
              인천 검단구 이음이로 70
            </p>

            <p>
              <Phone size={15} />
              <a href="tel:01021119597">
                010-2111-9597
              </a>
            </p>

            <p>
              <FileCheck2 size={15} />
              매입 조건은 차량 검수 및 계약 협의에 따라
              결정됩니다.
            </p>
          </div>

          <div className="hbCopyright">
            © {new Date().getFullYear()} HIGH BIKE.
            ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </main>
  );
}
