import {
  MousePointerClick,
  ClipboardCheck,
  Handshake,
  Star,
  Eye as TransparencyIcon,
  Handshake as HandshakeIcon,
  Headphones,
} from 'lucide-react'
import Reveal from '../components/Reveal'
import Accordion from '../components/Accordion'
import usePageMeta from '../hooks/usePageMeta'
import { pageTitle } from '../constants/brand'
import './About.css'

const workSteps = [
  {
    icon: MousePointerClick,
    title: 'გამოიძახე დახმარება',
    description:
      'ბიზნესი აირჩევს კატეგორიას, აღწერს პრობლემას და მიუთითებს პრიორიტეტს — ისევე მარტივად, როგორც ტაქსის გამოძახება.',
  },
  {
    icon: ClipboardCheck,
    title: 'მენეჯერი აფასებს',
    description:
      'მენეჯერი ხედავს თიქეტს, აფასებს სამუშაოს და გიგზავნის ფასის შეთავაზებას დადასტურებისთვის.',
  },
  {
    icon: Handshake,
    title: 'ფასის დადასტურება',
    description:
      'ბიზნესი ხედავს შეთავაზებულ ფასს და ეთანხმება — მხოლოდ ამის შემდეგ იწყება მუშაობა.',
  },
  {
    icon: Star,
    title: 'შემსრულება და შეფასება',
    description:
      'მენეჯერი აძლევს საქმეს გადამოწმებულ შემსრულებელს. დასრულების შემდეგ შეგიძლია შეაფასო მუშაობა.',
  },
]

const team = [
  {
    name: 'გიორგი მ.',
    role: 'მენეჯერი',
    bio: 'პასუხისმგებელია კლიენტებთან კომუნიკაციაზე, პარტნიორების კოორდინაციაზე და ხარისხის კონტროლზე. ყოველთვის მზად არის დაგეხმაროს.',
    initials: 'GM',
  },
  {
    name: 'ნიკა კ.',
    role: 'დამფუძნებელი / დეველოპერი',
    bio: 'DIGIT-ის შემქმნელი. მისი მიზანია — ტექნოლოგია და ადამიანური მიდგომა ერთად, რომ ყველას ენდოთ სერვისს, რომელსაც იყენებ.',
    initials: 'NK',
  },
  {
    name: 'ანა ბ.',
    role: 'კლიენტთა მხარდაჭერა',
    bio: 'პირველი კონტაქტი ხშირად ანაა — უსმენს, პასუხობს კითხვებს და ზრუნავს, რომ პროცესი გლუვად წავიდეს დასაწყებიდან ბოლომდე.',
    initials: 'AB',
  },
]

const faqItems = [
  {
    question: 'როგორ ვირჩევთ პარტნიორებს?',
    answer:
      'ყველა პარტნიორი გადის შესაბამის შემოწმებას — გამოცდილება, რეკომენდაციები და სატესტო სამუშაო. მხოლოდ მათ, ვისაც ვენდობით, ვანდებით თქვენს მოთხოვნას. მენეჯერი ყოველთვის ირჩევს სპეციალისტს კონკრეტული ამოცანის მიხედვით, არა შემთხვევით.',
  },
  {
    question: 'რა ხდება თუ სამუშაო ხარისხიანად არ შესრულდა?',
    answer:
      'ჩვენი მიდგომა მარტივია — თუ შედეგი არ გაგიმჯობესიათ, დაუკავშირდით მენეჯერს. ერთად განვიხილავთ საკითხს და მოვძებნით გამოსავალს: გადაკეთება, კორექტირება ან სხვა გზა. თქვენი კმაყოფილება ჩვენთვის პრიორიტეტია.',
  },
  {
    question: 'რამდენი ღირს სერვისი?',
    answer:
      'ფასი დამოკიდებულია კონკრეტულ ამოცანაზე. მენეჯერი შეაფასებს მოთხოვნას და მუშაობის დაწყებამდე შეგათანხმებთ ფასს — გამჭვირვალედ, უსიამოვნო სიურპრიზების გარეშე. არაფერი არ იწყება თქვენი თანხმობის გარეშე.',
  },
  {
    question: 'რამდენ ხანში მიპასუხებენ?',
    answer:
      'სამუშაო საათებში, როგორც წესი, 1-2 საათში გიპასუხებენ. გადაუდებელი შემთხვევებისთვის მიუთითეთ ეს მოთხოვნაში — ვეცდებით მაქსიმალურად სწრაფად გიპასუხოთ.',
  },
  {
    question: 'როგორ ვეთანხმები ფასს?',
    answer:
      'მენეჯერი გიგზავნით ფასის შეთავაზებას დაკავშირების გვერდზე. ფასს ხედავ ნათლად — „დათანხმება“ ღილაკით ეთანხმები, „უარყოფა“-თ კი აცხორებ ან წინადადებ. მუშაობა იწყება მხოლოდ შენი დადასტურების შემდეგ.',
  },
  {
    question: 'შემიძლია უშუალოდ ვისთან ვისაუბრო?',
    answer:
      'პირველ ეტაპზე ყველა კომუნიკაცია მიდის მენეჯერის ან ადმინისტრაციის მეშვეობით — ეს გვაძლევს საშუალებას კონტროლი გვქონდეს პროცესზე და ხარისხზე. სამუშაოს დაწყების შემდეგ, საჭირების შემთხვევაში, შესაძლებელია პირდაპირი კონტაქტი სპეციალისტთან, მენეჯერის ხელმძღვანელობით.',
  },
]

const trustBadges = [
  {
    icon: TransparencyIcon,
    title: '100% გამჭვირვალობა',
    text: 'იცი რას, რატომ და რამდენად — ყველა ნაბიჯი ნათელია.',
  },
  {
    icon: HandshakeIcon,
    title: 'ფასის შეთანხმება წინასწარ',
    text: 'მუშაობა იწყება მხოლოდ მაშინ, როცა ფასს და პირობებს ეთანხმები.',
  },
  {
    icon: Headphones,
    title: 'პირდაპირი კონტაქტი მენეჯერთან',
    text: 'ერთი სანდო ადამიანი გიპასუხება — არა უცნობი ნომერი ან უპასუხო მოთხოვნა.',
  },
]

function About() {
  usePageMeta(
    pageTitle('ჩვენ შესახებ'),
    'DIGIT — ჩვენი ისტორია, გუნდი და გარანტიები. სანდო გზა სპეციალისტებთან ერთი მენეჯერის კონტროლით.'
  )

  return (
    <div className="about">
      <section className="about-mission">
        <div className="container">
          <Reveal className="about-mission__inner">
            <span className="about-mission__label">ჩვენი ისტორია</span>
            <h1 className="about-mission__title">ნდობა, რომელიც გამოიმსახურებს</h1>
            <div className="about-mission__text">
              <p>
                DIGIT არის პლატფორმა, სადაც ბიზნესი იღებს IT დახმარებას ერთი მენეჯერის კონტროლით —
                გამჭვირვალე პროცესით, გადამოწმებული შემსრულებლებით.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="about-section about-work">
        <div className="container">
          <Reveal className="about-section__header">
            <h2 className="about-section__title">როგორ ვმუშაობთ</h2>
            <p className="about-section__subtitle">
              ყველა ნაბიჯი გამჭვირვალია — შენ ყოველთვის იცი რა ხდება
            </p>
          </Reveal>

          <div className="about-work__steps">
            {workSteps.map(({ icon: Icon, title, description }, index) => (
              <Reveal key={title} className="about-work__step" delay={index * 100}>
                <div className="about-work__step-num">{index + 1}</div>
                <div className="about-work__step-icon">
                  <Icon size={24} strokeWidth={1.75} />
                </div>
                <h3 className="about-work__step-title">{title}</h3>
                <p className="about-work__step-text">{description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-team">
        <div className="container">
          <Reveal className="about-section__header">
            <h2 className="about-section__title">ჩვენი გუნდი</h2>
            <p className="about-section__subtitle">
              ადამიანები, რომლებიც ზრუნავენ შენს გამოცდილებაზე
            </p>
          </Reveal>

          <div className="about-team__grid">
            {team.map(({ name, role, bio, initials }, index) => (
              <Reveal key={name} className="team-card" delay={index * 100}>
                <div className="team-card__avatar" aria-hidden="true">
                  {initials}
                </div>
                <h3 className="team-card__name">{name}</h3>
                <p className="team-card__role">{role}</p>
                <p className="team-card__bio">{bio}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-faq">
        <div className="container">
          <Reveal className="about-section__header">
            <h2 className="about-section__title">ხშირად დასმული კითხვები</h2>
            <p className="about-section__subtitle">
              პასუხები, რომლებიც შესაძლობს დაგეხმაროთ გადაწყვეტილების მიღებაში
            </p>
          </Reveal>

          <Reveal delay={100}>
            <Accordion items={faqItems} />
          </Reveal>
        </div>
      </section>

      <section className="about-section about-trust">
        <div className="container">
          <Reveal className="about-section__header">
            <h2 className="about-section__title">ჩვენი გარანტიები</h2>
            <p className="about-section__subtitle">
              პრინციპები, რომლებზეც აგებულია DIGIT
            </p>
          </Reveal>

          <div className="about-trust__grid">
            {trustBadges.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} className="trust-badge" delay={index * 80}>
                <div className="trust-badge__icon">
                  <Icon size={26} strokeWidth={1.75} />
                </div>
                <h3 className="trust-badge__title">{title}</h3>
                <p className="trust-badge__text">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
