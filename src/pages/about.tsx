import IndexLayout from '../layouts';
import Wrapper from '../components/Wrapper';
import SiteNav from '../components/header/SiteNav';
import { SiteHeader, outer, inner, SiteMain } from '../styles/shared';
import * as React from 'react';
import { css } from '@emotion/core';

import { PostFullHeader, PostFullTitle, NoImage, PostFull } from '../templates/post';
import { PostFullContent } from '../components/PostContent';
import Footer from '../components/Footer';
import Helmet from 'react-helmet';

const PageTemplate = css`
  .site-main {
    background: #fff;
    padding-bottom: 4vw;
  }
`;

const About: React.FC = () => (
  <IndexLayout>
    <Helmet>
      <title>About</title>
    </Helmet>
    <Wrapper css={PageTemplate}>
      <header css={[outer, SiteHeader]}>
        <div css={inner}>
          <SiteNav />
        </div>
      </header>
      <main id="site-main" className="site-main" css={[SiteMain, outer]}>
        <article className="post page" css={[PostFull, NoImage]}>
          <PostFullHeader>
            <PostFullTitle>About..?</PostFullTitle>
          </PostFullHeader>

          <PostFullContent className="post-full-content">
            <div className="post-content">
              <p>안녕하세요, 사실 여기엔 뭘 써야 할지 감이 오질 않네요.</p>
              <p>
                이 블로그가 평범한 <code>static blog with N articles</code> 가 되지 않게 하기 위해
                노력하고 있습니다. python, 그 중에서도 asyncio와 core에 대해서 뭘 해보려고 하는데
                정작 하는건 별로 없네요.
              </p>
              <p>
                말할것도 딱히 없는 김에 제 소개를 하자면 제 이름은 김성현이고, MyMusicTste에서
                파이썬으로 백앤드 개발자를 하고 있습니다. asyncio를 적극 활용할 수
                있어서 재미있게 일하고 있습니다. 파이콘 한국 2019에서 <b>리얼월드 메타클래스</b>라는
                제목으로 발표도 했었습니다. 지금 꿈은 파이썬 코어 개발자가 되는 것? 정도가 있겠네요.
              </p>
              <p>
                취미라고 한다면 비행 시뮬레이션과 건담 프라모델 정도가 있겠네요. DCS 하실래요?
                갓겜입니다. 디시인사이드 DCS 마이너 갤러리에 놀러오세요
              </p>
              <p>
                이름이 MyMusicTaste인 회사에 다니는데 좋아하는 가수나 연예인이 없냐고 물어보신다면
                소녀시대 태연을 좋아합니다. 최고존엄입니다 아 단콘 언제열리지 10월 22일에 정규앨범 나와요
              </p>
              <iframe
                width="100%"
                height="570px"
                src="https://www.youtube.com/embed/0AaHwdnnuHk"
                frameborder="3"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
              <p>
                <br />
                사실 이거 블로그 티스토리보다 SEO가 잘 안되는건가 검색이 잘 안되서 좀 맘에 안드는데
                이뻐서 쓰고있어요. 프론트엔드 1도 모르니까 만지기 힘드네요
              </p>
              <p>대충 한페이지쯤 쓴것같은데 뭐 여러분 모두 적게 일하고 많이 버세요 이만 총총~</p>
            </div>
          </PostFullContent>
        </article>
      </main>
      <Footer />
    </Wrapper>
  </IndexLayout>
);

export default About;
