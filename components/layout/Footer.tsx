import React from 'react';

const Footer = () => {
    return (
        <footer className="border-border bg-muted/30 rounded-2xl border p-8 text-center shadow-sm">
            <div className="space-y-3">
                <p className="text-foreground text-lg font-semibold">
                    UniNavi <span aria-hidden="true">🎓</span>
                </p>
                <p className="text-muted-foreground text-sm">
                    AI大学検索アプリ - 高校生の進路選択をサポートします。
                    最新情報は各大学の公式サイトで必ずご確認ください。
                </p>
                <p className="text-muted-foreground/70 text-xs">© {new Date().getFullYear()} UniNavi</p>
            </div>
        </footer>
    );
};

export default Footer;
