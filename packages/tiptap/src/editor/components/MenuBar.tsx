import { memo } from "react";
import AlignPopover from "./controls/AlignPopover";

import BoldButton from "./controls/BoldButton";
// import BlockquoteButton from "./controls/BlockquoteButton";
import BulletListButton from "./controls/BulletListButton";
import HeadingDropdown from "./controls/HeadingDropdown";
// import CodeBlockButton from "./controls/CodeBlockButton";
import ImageButton from "./controls/ImageButton2";
import InsertDropdown from "./controls/InsertDropdown";
import ItalicButton from "./controls/ItalicButton";
import LinkButton from "./controls/LinkButton";
import MoreMarkDropdown from "./controls/MoreMarkPopover";
import OrderedListButton from "./controls/OrderedList";
import RedoButton from "./controls/RedoButton";
import TableButton from "./controls/TableButton";
// import YoutubeButton from "./controls/YoutubeButton";
import TextColorButton from "./controls/TextColorButton";
import TextHighlightButton from "./controls/TextHighlightButton";
// import ClearFormatButton from "./controls/ClearFormatButton";
import UnderlineButton from "./controls/UnderlineButton";
import UndoButton from "./controls/UndoButton";
import { Toolbar, ToolbarDivider } from "./ui/Toolbar";

const MenuBar = () => {
  return (
    <div className="rte-menu-bar">
      <Toolbar dense>
        <UndoButton />
        <RedoButton />
        {/* <ClearFormatButton /> */}

        <ToolbarDivider />

        <HeadingDropdown />

        <ToolbarDivider />

        <BoldButton />
        <ItalicButton />
        <UnderlineButton />
        <MoreMarkDropdown />

        <ToolbarDivider />

        <TextColorButton />
        <TextHighlightButton />

        <ToolbarDivider />

        <AlignPopover />
        <BulletListButton />
        <OrderedListButton />

        <ToolbarDivider />

        {/* <BlockquoteButton /> */}
        <LinkButton />
        <TableButton />
        <ImageButton />
        {/* <YoutubeButton /> */}
        {/* <CodeBlockButton /> */}
        <InsertDropdown />
      </Toolbar>
    </div>
  );
};

export default memo(MenuBar);
