import React, { useState, useEffect } from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import classNames from "classnames";

import ObserveModelMixin from "terriajs/lib/ReactViews/ObserveModelMixin";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";

import Styles from "./notice.scss";

import CloseButton from "./CloseButton.jsx";

import { useKeyPress } from "./useKeyPress.js";

// Copied from https://github.com/TerriaJS/nationalmap/blob/655fde24b1b76292252e7425062c2129aa3c90fc/lib/Views/Anniversary/Celebration.jsx

const Notice = createReactClass({
  displayName: "Notice",
  mixins: [ObserveModelMixin],
  propTypes: {
    viewState: PropTypes.object.isRequired
  },
  componentWillMount() {
    this.props.viewState.showNotice = true;
    knockout.track(this.props.viewState, ["showNotice"]);
  },
  render() {
    const viewState = this.props.viewState || {};

    return (
      <NoticePure
        showNotice={viewState.showNotice}
        setShowNotice={bool => {
          viewState.showNotice = bool;
        }}
        viewState={this.props.viewState}
      />
    );
  }
});

export const NoticePure = ({ showNotice, setShowNotice, viewState }) => {
  const [noticeVisible, setNoticeVisible] = useState(true);
  const [noticeIsAnimating, setNoticeIsAnimating] = useState(false);

  useKeyPress("Escape", () => {
    if (showNotice) {
      handleClose(false);
    }
  });

  // Listen to viewState's version of whether we show the modal
  useEffect(() => {
    if (showNotice) {
      setNoticeVisible(true);
    }
  }, [showNotice]);

  // We need to make sure the component stays mounted while it's animating
  // but also disable the rest of the modal once it's finished
  useEffect(() => {
    if (noticeIsAnimating) {
      setTimeout(() => {
        setNoticeIsAnimating(false);
      }, 300);
    }
  }, [noticeIsAnimating]);

  const handleClose = (persist = true) => {
    setNoticeIsAnimating(true);
    setNoticeVisible(false);
    setTimeout(() => {
      // Ensures next open of it starts from the correct beginning frame
      setNoticeVisible(true);
      setShowNotice(false);
    }, 300);
  };

  return (
    <>
      <If condition={showNotice || noticeIsAnimating}>
        <div
          className={classNames({
            [Styles.popupModalWrapper]: true,
            [Styles.popupModalWrapperClosing]: !noticeVisible
          })}
          onClick={handleClose.bind(null, false)}
        >
          <article
            className={Styles.popupModal}
            style={{
              backgroundImage: `url(${require("../../../wwwroot/images/notice-bg.jpg")})`
            }}
            // Allows interaction w/ modal without closing
            onClick={e => e.stopPropagation()}
          >
            {/* Most of the code here are just commented out so we
                could potentially reuse them in the future */}

            {/* <span className={Styles.streamersWrapper}>
              <Streamers
                alt="Anniversary Streamers"
                className={Styles.streamers}
              />
            </span> */}
            <CloseButton onClick={handleClose.bind(null, false)} />
            <h1>
              Notice of decommissioning
            </h1>
            <span className={Styles.popupModalBody}>
              {/* <p>
                We’re looking for great stories.
                <br />
                Help us tell yours!
              </p> */}
              <div className={Styles.popupModalQuestions}>
                <p>
                  Dear users,
                  <br /> As ongoing funding to support maintenance and
                  development has not been identified, the AREMI platform will
                  be decommissioned on 31st of January 2021 with all the
                  relevant datasets being migrated to the{" "}
                  <a href="https://nationalmap.gov.au/" target="_blank">
                    Australian NationalMap
                  </a>
                  . While efforts are made to limit the disruption to users and
                  data custodians, please expect some data or functionalities'
                  discrepancies. Please let us know your feedback by emailing{" "}
                  <a href="mailto:info@terria.io">info@terria.io</a>. Thank you
                  for your support!
                </p>
              </div>
              {/* <a
                href={`mailto:info@terria.io?subject=National Map Anniversary Feedback&body=What%20impact%20has%20NationalMap%20had%20on%20you%3F%0A%0AWhat%20changes%20would%20you%20like%20to%20see%3F`}
                className={Styles.popupModalButton}
                title="Send us a birthday email!"
              >
                <MailIcon
                  className={Styles.popupModalButtonIcon}
                  role="presentation"
                  aria-hidden="true"
                />
                Send us a birthday email
              </a>
              <button
                className={Styles.popupModalButton}
                onClick={() => {
                  handleClose(true);
                  setTimeout(() => {
                    viewState.feedbackFormIsVisible = true;
                  }, 300);
                }}
              >
                <FeedbackIcon
                  className={Styles.popupModalButtonIcon}
                  role="presentation"
                  aria-hidden="true"
                />
                Leave feedback
              </button> */}
              <p>
                <button
                  className={Styles.popupModalCloseLink}
                  onClick={handleClose.bind(null, false)}
                >
                  Close message
                </button>{" "}
              </p>
            </span>
            {/* <footer className={Styles.popupModalFooter}>
              Be gentle, we read all of your comments (thank you!)
            </footer> */}
          </article>
        </div>
      </If>
    </>
  );
};

NoticePure.propTypes = {
  showNotice: PropTypes.bool.isRequired,
  setShowNotice: PropTypes.func.isRequired,
  viewState: PropTypes.object.isRequired
};

export default Notice;
