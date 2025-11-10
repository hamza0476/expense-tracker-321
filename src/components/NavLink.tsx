import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className" | "children"> {
  className?: string | ((props: { isActive: boolean; isPending: boolean }) => string);
  activeClassName?: string;
  pendingClassName?: string;
  children?: ReactNode | ((props: { isActive: boolean; isPending: boolean }) => ReactNode);
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, children, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) => {
          if (typeof className === "function") {
            return className({ isActive, isPending });
          }
          return cn(className, isActive && activeClassName, isPending && pendingClassName);
        }}
        {...props}
      >
        {({ isActive, isPending }) => {
          if (typeof children === "function") {
            return children({ isActive, isPending });
          }
          return children;
        }}
      </RouterNavLink>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
