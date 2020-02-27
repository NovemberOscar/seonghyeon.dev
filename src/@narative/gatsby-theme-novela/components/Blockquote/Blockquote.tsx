import styled from "@emotion/styled";
import mediaqueries from "@styles/media";

const Blockquote = styled.blockquote`
  transition: ${p => p.theme.colorModeTransition};
  margin: 15px auto 50px;
  color: ${p => p.theme.colors.articleText};
  font-family: ${p => p.theme.fonts.serif};
  font-style: italic;
  border-left: 3px solid;
  color: #c7c7c782;
  word-break: keep-all;
  padding: 10px 0px 12px 25px;

  ${mediaqueries.tablet`
    margin: 10px auto 35px;
    padding: 0px 0px 0px 0px;
    border-left: 0px;
  `};

  & > p {
    font-family: ${p => p.theme.fonts.serif};
    max-width: 880px !important;
    padding-top: 5px;
    padding-right: 100px;
    padding-bottom: 0;
    width: 100%;
    margin: 0 auto;
    font-size: 25px;
    line-height: 1.32;
    font-weight: bold;

    ${mediaqueries.tablet`
      font-size: 20px;
      padding: 0 180px;
    `};

    ${mediaqueries.phablet`
      font-size: 25px;
      padding: 0 20px 0 40px;
    `};
  }
`;

export default Blockquote;