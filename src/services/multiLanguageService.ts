export interface Translation {
  [key: string]: string | Translation
}

export interface LanguageConfig {
  code: string
  name: string
  nativeName: string
  flag: string
  rtl: boolean
}

export const supportedLanguages: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', rtl: false },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦', rtl: false },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦', rtl: false },
  { code: 'st', name: 'Sotho', nativeName: 'Sesotho', flag: '🇿🇦', rtl: false },
  { code: 'tn', name: 'Tswana', nativeName: 'Setswana', flag: '🇿🇦', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false }
]

const translations: Record<string, Translation> = {
  en: {
    common: {
      welcome: 'Welcome to FraudShield',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      yes: 'Yes',
      no: 'No',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      upload: 'Upload',
      download: 'Download'
    },
    menu: {
      verifyPayment: '🔷 1 Verify EFT / PoP',
      checkDocument: '🔷 2 Check RFQ / PO authenticity',
      generatePin: '🔷 3 Generate release PIN for driver',
      viewLogs: '🔷 4 View today\'s fraud check log',
      help: '🆘 Help',
      talkToSupport: 'Talk to support'
    },
    verification: {
      uploadProof: 'Please upload the proof of payment (screenshot, PDF) or enter transaction details:',
      bankName: 'Bank Name',
      reference: 'Reference',
      amount: 'Amount',
      checking: '🔎 Checking payment against your linked bank account…',
      verified: '✅ Payment verified: R{amount} cleared from {company}.',
      notCleared: '🚨 Warning: No cleared payment found for this transaction. Please wait until funds reflect before delivering.',
      generatePinQuestion: 'Do you want me to generate a release PIN for your driver? (Yes/No)',
      saveLogQuestion: 'Do you want to save this check to your log? (Yes/No)'
    },
    document: {
      uploadDocument: '📄 Please upload the RFQ / PO document or paste the full text/email here.',
      verifying: '🔎 Verifying document details:',
      checkingDomain: '✅ Checking domain legitimacy',
      checkingCompany: '✅ Matching company name against registry',
      checkingContact: '✅ Checking contact details',
      authentic: '✅ RFQ/PO appears authentic and issued by a registered company ({company}, Reg #{regNumber}).',
      suspicious: '🚨 Warning: Domain "{domain}" does NOT match official domain. PO may be fraudulent. Please confirm with official contact.'
    },
    pin: {
      enterDetails: '🚚 Please enter:',
      customerName: 'Customer Name',
      orderAmount: 'Order Amount',
      checkingVerification: '🔎 Checking previous verification…',
      paymentVerified: '✅ Payment verified.',
      releasePin: '🔐 Release PIN for driver: {pin}',
      sharePinInstruction: 'Share this PIN only when handing over goods.'
    },
    logs: {
      todayLog: '📜 Here is your fraud check log for today (PDF attached).',
      specificDate: 'To view logs for a specific date, type: log YYYY-MM-DD'
    },
    help: {
      options: '🆘 You can:',
      verifyPop: 'Verify PoP',
      checkRfq: 'check RFQ/PO',
      getPin: 'get driver PIN',
      viewLogs: 'view logs'
    }
  },
  af: {
    common: {
      welcome: 'Welkom by FraudShield',
      loading: 'Laai...',
      error: 'Fout',
      success: 'Sukses',
      warning: 'Waarskuwing',
      info: 'Inligting',
      yes: 'Ja',
      no: 'Nee',
      cancel: 'Kanselleer',
      confirm: 'Bevestig',
      save: 'Stoor',
      delete: 'Verwyder',
      edit: 'Wysig',
      view: 'Bekyk',
      upload: 'Oplaai',
      download: 'Aflaai'
    },
    menu: {
      verifyPayment: '🔷 1 Verifieer EFT / PoP',
      checkDocument: '🔷 2 Kontroleer RFQ / PO egtheid',
      generatePin: '🔷 3 Genereer vrystelling PIN vir bestuurder',
      viewLogs: '🔷 4 Bekyk vandag se bedrog kontrole log',
      help: '🆘 Hulp',
      talkToSupport: 'Praat met ondersteuning'
    },
    verification: {
      uploadProof: 'Laai asseblief die bewys van betaling op (skermkiekie, PDF) of voer transaksie besonderhede in:',
      bankName: 'Bank Naam',
      reference: 'Verwysing',
      amount: 'Bedrag',
      checking: '🔎 Kontroleer betaling teen jou gekoppelde bankrekening…',
      verified: '✅ Betaling geverifieer: R{amount} geklaar van {company}.',
      notCleared: '🚨 Waarskuwing: Geen geklaarde betaling gevind vir hierdie transaksie nie. Wag asseblief totdat fondse reflekteer voor aflewering.',
      generatePinQuestion: 'Wil jy hê ek moet \'n vrystelling PIN vir jou bestuurder genereer? (Ja/Nee)',
      saveLogQuestion: 'Wil jy hierdie kontrole in jou log stoor? (Ja/Nee)'
    },
    document: {
      uploadDocument: '📄 Laai asseblief die RFQ / PO dokument op of plak die volledige teks/e-pos hier.',
      verifying: '🔎 Verifieer dokument besonderhede:',
      checkingDomain: '✅ Kontroleer domein legitimiteit',
      checkingCompany: '✅ Pas maatskappy naam teen register',
      checkingContact: '✅ Kontroleer kontak besonderhede',
      authentic: '✅ RFQ/PO lyk eg en uitgereik deur \'n geregistreerde maatskappy ({company}, Reg #{regNumber}).',
      suspicious: '🚨 Waarskuwing: Domein "{domain}" stem NIE ooreen met amptelike domein nie. PO kan bedrieglik wees. Bevestig asseblief met amptelike kontak.'
    },
    pin: {
      enterDetails: '🚚 Voer asseblief in:',
      customerName: 'Kliënt Naam',
      orderAmount: 'Bestelling Bedrag',
      checkingVerification: '🔎 Kontroleer vorige verifikasie…',
      paymentVerified: '✅ Betaling geverifieer.',
      releasePin: '🔐 Vrystelling PIN vir bestuurder: {pin}',
      sharePinInstruction: 'Deel hierdie PIN slegs wanneer goedere oorhandig word.'
    },
    logs: {
      todayLog: '📜 Hier is jou bedrog kontrole log vir vandag (PDF aangeheg).',
      specificDate: 'Om logs vir \'n spesifieke datum te bekyk, tik: log JJJJ-MM-DD'
    },
    help: {
      options: '🆘 Jy kan:',
      verifyPop: 'Verifieer PoP',
      checkRfq: 'kontroleer RFQ/PO',
      getPin: 'kry bestuurder PIN',
      viewLogs: 'bekyk logs'
    }
  },
  zu: {
    common: {
      welcome: 'Siyakwamukela ku-FraudShield',
      loading: 'Iyalayisha...',
      error: 'Iphutha',
      success: 'Impumelelo',
      warning: 'Isexwayiso',
      info: 'Ulwazi',
      yes: 'Yebo',
      no: 'Cha',
      cancel: 'Khansela',
      confirm: 'Qinisekisa',
      save: 'Londoloza',
      delete: 'Susa',
      edit: 'Hlela',
      view: 'Buka',
      upload: 'Layisha',
      download: 'Dawuniloda'
    },
    menu: {
      verifyPayment: '🔷 1 Qinisekisa i-EFT / PoP',
      checkDocument: '🔷 2 Hlola ubuqotho be-RFQ / PO',
      generatePin: '🔷 3 Khiqiza i-PIN yokukhulula umshayeli',
      viewLogs: '🔷 4 Buka ilog yokuhlola ukukhohlisa yanamuhla',
      help: '🆘 Usizo',
      talkToSupport: 'Khuluma nesekelo'
    },
    verification: {
      uploadProof: 'Sicela ulayishe ubufakazi bokukhokha (isithombe-skrini, i-PDF) noma ufake imininingwane yentengiselwano:',
      bankName: 'Igama Lebhange',
      reference: 'Inkomba',
      amount: 'Inani',
      checking: '🔎 Sihlola inkokhelo ngokumelene ne-akhawunti yakho yebhange ehlanganisiwe…',
      verified: '✅ Inkokhelo iqinisekisiwe: R{amount} isuswe ku-{company}.',
      notCleared: '🚨 Isexwayiso: Ayikho inkokhelo esusiwe etholakele kule ntengiselwano. Sicela ulinde kuze kufike imali ngaphambi kokulethwa.',
      generatePinQuestion: 'Ingabe ufuna ngikhiqize i-PIN yokukhulula umshayeli wakho? (Yebo/Cha)',
      saveLogQuestion: 'Ingabe ufuna ukugcina lolu hlolo ku-log yakho? (Yebo/Cha)'
    },
    document: {
      uploadDocument: '📄 Sicela ulayishe idokhumenti ye-RFQ / PO noma unamathisele umbhalo ogcwele/i-imeyili lapha.',
      verifying: '🔎 Siqinisekisa imininingwane yedokhumenti:',
      checkingDomain: '✅ Sihlola ubuqotho be-domain',
      checkingCompany: '✅ Sifanisa igama lenkampani ngohlelo',
      checkingContact: '✅ Sihlola imininingwane yokuxhumana',
      authentic: '✅ I-RFQ/PO ibonakala iqotho futhi ikhishwe yinkampani ebhalisiwe ({company}, Reg #{regNumber}).',
      suspicious: '🚨 Isexwayiso: I-domain "{domain}" AYIFANI ne-domain esemthethweni. I-PO ingase ibe yinkohliso. Sicela uqinisekise ngoxhumana osemthethweni.'
    },
    pin: {
      enterDetails: '🚚 Sicela ufake:',
      customerName: 'Igama Lekhasimende',
      orderAmount: 'Inani Loda-oda',
      checkingVerification: '🔎 Sihlola ukuqinisekiswa kwangaphambilini…',
      paymentVerified: '✅ Inkokhelo iqinisekisiwe.',
      releasePin: '🔐 I-PIN yokukhulula umshayeli: {pin}',
      sharePinInstruction: 'Yabelana nge-PIN kuphela lapho unikeza izimpahla.'
    },
    logs: {
      todayLog: '📜 Nali ilog yakho yokuhlola ukukhohlisa yanamuhla (i-PDF inamathisiwe).',
      specificDate: 'Ukubuka ama-log osuku oluthile, thayipha: log YYYY-MM-DD'
    },
    help: {
      options: '🆘 Ungakwazi:',
      verifyPop: 'Qinisekisa i-PoP',
      checkRfq: 'hlola i-RFQ/PO',
      getPin: 'thola i-PIN yomshayeli',
      viewLogs: 'buka ama-log'
    }
  }
}

class MultiLanguageService {
  private currentLanguage: string = 'en'
  private fallbackLanguage: string = 'en'

  constructor() {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('fraudshield_language')
    if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
      this.currentLanguage = savedLanguage
    } else {
      // Auto-detect browser language
      const browserLanguage = navigator.language.split('-')[0]
      if (this.isLanguageSupported(browserLanguage)) {
        this.currentLanguage = browserLanguage
      }
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage
  }

  setLanguage(languageCode: string): void {
    if (this.isLanguageSupported(languageCode)) {
      this.currentLanguage = languageCode
      localStorage.setItem('fraudshield_language', languageCode)
      
      // Update document direction for RTL languages
      const language = supportedLanguages.find(lang => lang.code === languageCode)
      if (language) {
        document.dir = language.rtl ? 'rtl' : 'ltr'
        document.documentElement.lang = languageCode
      }
    }
  }

  isLanguageSupported(languageCode: string): boolean {
    return supportedLanguages.some(lang => lang.code === languageCode)
  }

  getSupportedLanguages(): LanguageConfig[] {
    return supportedLanguages
  }

  getCurrentLanguageConfig(): LanguageConfig {
    return supportedLanguages.find(lang => lang.code === this.currentLanguage) || supportedLanguages[0]
  }

  // Get translation with nested key support (e.g., 'common.welcome')
  translate(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.')
    let translation: any = translations[this.currentLanguage]
    
    // Navigate through nested keys
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k]
      } else {
        // Fallback to English if key not found
        translation = translations[this.fallbackLanguage]
        for (const fallbackKey of keys) {
          if (translation && typeof translation === 'object' && fallbackKey in translation) {
            translation = translation[fallbackKey]
          } else {
            return key // Return key if translation not found
          }
        }
        break
      }
    }

    if (typeof translation !== 'string') {
      return key
    }

    // Replace parameters in translation
    if (params) {
      return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match
      })
    }

    return translation
  }

  // Shorthand for translate
  t(key: string, params?: Record<string, string | number>): string {
    return this.translate(key, params)
  }

  // Get all translations for current language (useful for React context)
  getAllTranslations(): Translation {
    return translations[this.currentLanguage] || translations[this.fallbackLanguage]
  }

  // Format currency based on language/region
  formatCurrency(amount: number): string {
    const language = this.getCurrentLanguageConfig()
    
    // South African Rand formatting
    if (['af', 'zu', 'xh', 'st', 'tn'].includes(language.code)) {
      return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
    }
    
    // Default to South African format since this is a SA-focused app
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
  }

  // Format date based on language
  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const language = this.getCurrentLanguageConfig()
    
    return dateObj.toLocaleDateString(language.code === 'en' ? 'en-ZA' : language.code, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format time based on language
  formatTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const language = this.getCurrentLanguageConfig()
    
    return dateObj.toLocaleTimeString(language.code === 'en' ? 'en-ZA' : language.code, {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get localized fraud status messages
  getFraudStatusMessage(status: 'verified' | 'suspicious' | 'fraudulent', details?: any): string {
    switch (status) {
      case 'verified':
        return this.t('verification.verified', details)
      case 'suspicious':
        return this.t('document.suspicious', details)
      case 'fraudulent':
        return this.t('verification.notCleared')
      default:
        return status
    }
  }

  // Get localized menu options
  getMenuOptions(): Array<{ key: string; text: string; emoji: string }> {
    return [
      { key: 'verify', text: this.t('menu.verifyPayment'), emoji: '🔷' },
      { key: 'check', text: this.t('menu.checkDocument'), emoji: '🔷' },
      { key: 'pin', text: this.t('menu.generatePin'), emoji: '🔷' },
      { key: 'logs', text: this.t('menu.viewLogs'), emoji: '🔷' },
      { key: 'help', text: this.t('menu.help'), emoji: '🆘' }
    ]
  }
}

export const multiLanguageService = new MultiLanguageService()