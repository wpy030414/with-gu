<script setup lang="ts">
import ContentsShell from '@/components/frame/ContentsShell.vue'
import CostBoard from '@/components/basis/CostBoard.vue'
</script>

<template>
  <contents-shell class="shell">
    <img src="//pic.imgdb.cn/item/64d653901ddac507ccfa4d1d.png" alt="" title="嗷呜！" />
    <span>=>&nbsp;</span>
    <cost-board
      class="cb"
      :abnormal-factor="{ withMerchants: 1 }"
      title="桃金娘：有普信女，我不说是谁。"
    />
  </contents-shell>
</template>

<style scoped>
.shell {
  user-select: none;
}

img {
  width: 60px;
}

span {
  color: var(--g-c-main);
}

.cb {
  display: inline-block;
}
</style>
