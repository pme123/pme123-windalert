<template>
  <footer class="z9-footer">
    <div class="z9-footer-inner">
      <div class="z9-copyright">{{ t('footer.copyright') }}</div>
      <div class="z9-footer-right">
        <button class="footer-btn" @click="showPrivacy = true">{{ t('footer.privacy') }}</button>
        <a href="mailto:hallo@z9nai.ch" class="z9-mail-icon" title="hallo@z9nai.ch">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
        </svg>
        </a>
      </div>
    </div>

    <!-- Datenschutz Modal -->
    <div v-if="showPrivacy" class="privacy-overlay" @click.self="showPrivacy = false">
      <div class="privacy-modal">
        <div class="privacy-header">
          <span>{{ t('footer.privacyTitle') }}</span>
          <button class="privacy-close" @click="showPrivacy = false">✕</button>
        </div>
        <div class="privacy-body">
          <i18n-t keypath="footer.privacyIntro" tag="p" class="privacy-intro">
            <template #mail><a href="mailto:hallo@z9nai.ch">hallo@z9nai.ch</a></template>
          </i18n-t>
          <hr>
          <h4>{{ t('footer.noCookiesTitle') }}</h4>
          <p>{{ t('footer.noCookiesText') }}</p>
          <h4>{{ t('footer.hostingTitle') }}</h4>
          <i18n-t keypath="footer.hostingText" tag="p">
            <template #link><a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener">GitHub Privacy Policy</a></template>
          </i18n-t>
          <h4>{{ t('footer.weatherDataTitle') }}</h4>
          <i18n-t keypath="footer.weatherDataText" tag="p">
            <template #pioupiou><a href="https://pioupiou.fr" target="_blank" rel="noopener">Pioupiou / OpenWindMap</a></template>
            <template #meteoswiss><a href="https://www.meteoswiss.admin.ch" target="_blank" rel="noopener">MeteoSwiss</a></template>
            <template #wunderground><a href="https://www.wunderground.com" target="_blank" rel="noopener">Weather Underground</a></template>
          </i18n-t>
          <h4>{{ t('footer.contactTitle') }}</h4>
          <p>{{ t('footer.contactText') }}</p>
          <h4>{{ t('footer.rightsTitle') }}</h4>
          <i18n-t keypath="footer.rightsText" tag="p">
            <template #mail><a href="mailto:hallo@z9nai.ch">hallo@z9nai.ch</a></template>
          </i18n-t>
          <hr>
          <p class="privacy-footer-text">{{ t('footer.footerText') }}<br>{{ t('footer.footerDate') }}</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const showPrivacy = ref(false)
</script>
